# Ensure pylint can find the plugin files
import os
import sys
import keyword
import importlib
from tempfile import NamedTemporaryFile
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from io import StringIO
from pylint.lint import Run
from pylint.reporters.text import TextReporter
from astroid.manager import AstroidManager as _AstroidManager
from astroid.builder import AstroidBuilder as _AstroidBuilder

# Pyodide + astroid: astroid resolves most installed packages fine on its own (so
# import-error, no-name-in-module and no-member all work), but it can't build a
# few stdlib modules that are backed by built-ins under Emscripten -- notably
# `os` (which pulls in `posix`) -- and reports a false "Unable to import 'os'".
# We let astroid resolve normally and only fall back to a synthetic stub when it
# fails *and* the module is genuinely importable in this interpreter (Papyros
# installs the code's imports before linting). A real typo / missing package
# still raises, so import-error stays accurate.
#
# The stub is built from the live module's real `dir()`, so its names are the
# real names: `from os import asdfjasdlf` still correctly trips no-name-in-module,
# while `from os import getcwd` doesn't. Each name is assigned from the undefined
# `_papyros_any`, so astroid infers it as Uninferable and member access / calls on
# it don't trip false positives. A module-level __getattr__ is kept too, so
# dynamic attributes that aren't in dir() still don't trip no-member.
_orig_ast_from_module_name = _AstroidManager.ast_from_module_name


def _patched_ast_from_module_name(self, modname, *args, **kwargs):
    try:
        return _orig_ast_from_module_name(self, modname, *args, **kwargs)
    except Exception as astroid_error:
        # astroid couldn't build it (e.g. os -> posix built-in under Emscripten).
        # If it's genuinely importable here, stub it from its real names so we
        # don't emit a false import-error. Otherwise it's a real miss, so
        # re-raise the original astroid error.
        try:
            module = importlib.import_module(modname)
        except Exception:
            raise astroid_error
        names = [n for n in dir(module) if n.isidentifier() and not keyword.iskeyword(n) and not n.startswith("__")]
        src = "def __getattr__(name): ...\n" + "".join(f"{n} = _papyros_any\n" for n in names)
        return _AstroidBuilder(self).string_build(src, modname=modname)


_AstroidManager.ast_from_module_name = _patched_ast_from_module_name


PYLINT_RC_FILE = os.path.abspath("/tmp/papyros/pylint_config.rc")
PYLINT_PLUGINS = "pylint_ast_checker,pylint_turtle_brain"

def lint(code):
    # Packages were just installed (PythonWorker.lintCode installs imports first);
    # refresh the import caches so importlib.import_module() sees them in the
    # astroid stub-building hook above.
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
            diagnostics.append({
                "lineNr": line_nr,
                "columnNr": column_nr,
                "endLineNr": int(end_line) if end_line else line_nr,
                "endColumnNr": int(end_column) if end_column else column_nr,
                "severity": severity,
                 "message": message
            })
    return diagnostics
