# Ensure pylint can find the plugin files
import os
import sys
import importlib
import importlib.util
from tempfile import NamedTemporaryFile
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from io import StringIO
from pylint.lint import Run
from pylint.reporters.text import TextReporter
from astroid.manager import AstroidManager as _AstroidManager
from astroid.builder import AstroidBuilder as _AstroidBuilder

# Pyodide + astroid: astroid resolves most installed packages fine (so E0611 /
# no-member work), but it can't build a few stdlib modules that are backed by
# built-ins under Emscripten -- notably `os` (which pulls in `posix`) -- and
# reports a false "Unable to import 'os'". We let astroid resolve normally and
# only fall back to a synthetic stub when it fails *and* the module is genuinely
# importable in this interpreter (Papyros installs the code's imports before
# linting). A real typo / missing package still raises, so import-error stays
# accurate. The stub exposes a module-level __getattr__ so `os.getcwd()` style
# access doesn't trip no-member.
#
# We can't know the stubbed module's real names, so `from os import getcwd` would
# wrongly trip no-name-in-module (E0611, which ignores __getattr__). We record the
# modules we had to stub and drop E0611 for exactly those in process_pylint_output,
# leaving E0611 intact for everything astroid could analyse.
_STUB_SOURCE = "def __getattr__(name): ...\n"

_orig_ast_from_module_name = _AstroidManager.ast_from_module_name

# Modules astroid couldn't build but that are importable. Accumulated across the
# worker session: astroid caches module builds, so the hook only fires the first
# time a module is resolved -- clearing this per lint would lose the record on
# later lints that hit the cache.
_stubbed_modules: set = set()


def _is_importable(modname):
    try:
        if importlib.util.find_spec(modname) is not None:
            return True
    except Exception:
        pass
    # find_spec can return None / raise for some stdlib modules under Emscripten
    # (e.g. os), so fall back to actually importing it.
    try:
        importlib.import_module(modname)
        return True
    except Exception:
        return False


def _patched_ast_from_module_name(self, modname, *args, **kwargs):
    try:
        return _orig_ast_from_module_name(self, modname, *args, **kwargs)
    except Exception:
        # astroid couldn't build it (e.g. os -> posix built-in under Emscripten).
        # If it's genuinely importable here, hand back a stub so we don't emit a
        # false import-error. Otherwise it's a real miss, so re-raise.
        if _is_importable(modname):
            _stubbed_modules.add(modname)
            return _AstroidBuilder(self).string_build(_STUB_SOURCE, modname=modname)
        raise


_AstroidManager.ast_from_module_name = _patched_ast_from_module_name


PYLINT_RC_FILE = os.path.abspath("/tmp/papyros/pylint_config.rc")
PYLINT_PLUGINS = "pylint_ast_checker,pylint_turtle_brain"

def lint(code):
    # Packages were just installed (PythonWorker.lintCode installs imports first);
    # refresh the finder caches so find_spec() sees them in _is_importable().
    importlib.invalidate_caches()
    # Use temporary file to prevent Astroid cache from running into issues
    with NamedTemporaryFile() as tmpf:
        tmpf.write(bytes(code, encoding="utf-8"))
        tmpf.seek(0)
        pylint_output = StringIO()  # Custom open stream
        Run([
            "-j", "1", # ensure no parallellism is used as we don't have such resources in a worker
            "--rcfile", PYLINT_RC_FILE,
            "--load-plugins", PYLINT_PLUGINS,
            "--msg-template", "{path}:{line}:{column}:{end_line}:{end_column}:{category}:{msg}",
            tmpf.name], reporter=TextReporter(pylint_output), exit=False)

    return process_pylint_output(pylint_output.getvalue())

def process_pylint_output(linting_output):
    diagnostics = []
    for line in linting_output.split("\n"):
        line: str = line.rstrip()
        # {path}:{line}:{column}:{end_line}:{end_column}:{category}:{msg}
        if line.count(":") == 6:
            _, line_nr, column_nr, end_line, end_column, severity, message = line.rstrip().split(":")
            line_nr = int(line_nr)
            column_nr = int(column_nr)
            # If Pylint doesn't know the exact cause, just omit it
            message = message.replace("(<unknown>, ", "(")
            # Drop no-name-in-module for modules we had to stub (astroid couldn't
            # build them, so we can't verify their names -- see the stub hook above).
            if message.startswith("No name ") and " in module '" in message:
                stubbed_module = message.rsplit(" in module '", 1)[1].rstrip("'")
                if stubbed_module in _stubbed_modules:
                    continue
            diagnostics.append({
                "lineNr": line_nr,
                "columnNr": column_nr,
                "endLineNr": int(end_line) if end_line else line_nr,
                "endColumnNr": int(end_column) if end_column else column_nr,
                "severity": severity,
                 "message": message
            })
    return diagnostics
