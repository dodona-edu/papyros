# Ensure pylint can find the plugin files
import os
import re
import sys
from tempfile import NamedTemporaryFile
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from io import StringIO
from pylint.lint import Run
from pylint.reporters.text import TextReporter


PYLINT_RC_FILE = os.path.abspath("/tmp/papyros/pylint_config.rc")
PYLINT_PLUGINS = "pylint_ast_checker,pylint_turtle_brain"
# The path is omitted as it is the only field that can contain a colon itself
PYLINT_MSG_TEMPLATE = "{msg_id}:{line}:{column}:{end_line}:{end_column}:{category}:{msg}"
SYNTAX_ERROR_ID = "E0001"
# Pylint reports parse errors as "Parsing failed: '<message> (<file name>, line <nr>)'"
SYNTAX_ERROR_MESSAGE = re.compile(r"^Parsing failed: '(?P<message>.*) \(.*, line \d+\)'$")

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
            "--msg-template", PYLINT_MSG_TEMPLATE,
            tmpf.name], reporter=TextReporter(pylint_output), exit=False)

    return process_pylint_output(pylint_output.getvalue())

def process_pylint_output(linting_output):
    diagnostics = []
    for line in linting_output.split("\n"):
        # The message can contain colons itself, so only split off the fields in front of it
        parts = line.rstrip().split(":", 6)
        if len(parts) != 7:
            continue
        msg_id, line_nr, column_nr, end_line, end_column, severity, message = parts
        if not line_nr.isdigit() or not column_nr.isdigit():
            continue
        if msg_id == SYNTAX_ERROR_ID:
            # Unwrap the parse error to hide the name of the temporary file we linted
            match = SYNTAX_ERROR_MESSAGE.match(message)
            if match:
                message = match.group("message")
        line_nr = int(line_nr)
        column_nr = int(column_nr)
        diagnostics.append({
            "lineNr": line_nr,
            "columnNr": column_nr,
            "endLineNr": int(end_line) if end_line else line_nr,
            "endColumnNr": int(end_column) if end_column else column_nr,
            "severity": severity,
            "message": message
        })
    return diagnostics
