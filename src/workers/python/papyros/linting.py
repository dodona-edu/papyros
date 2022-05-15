# Ensure pylint can find the plugin files
import os
import sys
from tempfile import NamedTemporaryFile
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from io import StringIO
from pylint.lint import Run
from pylint.reporters.text import TextReporter

PYLINT_RC_FILE = os.path.abspath("papyros/pylint_config.rc")
PYLINT_PLUGINS = "pylint_ast_checker"

def lint(code):
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
            tmpf.name], reporter=TextReporter(pylint_output), do_exit=False)

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
