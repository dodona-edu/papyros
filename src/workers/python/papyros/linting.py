import os
from io import StringIO
from pylint.lint import Run
from pylint.reporters.text import TextReporter
from astroid import MANAGER
# define categories used for pylint messages
MESSAGE_CATEGORIES = {
    'F': 'fatal',
    'E': 'error',
    'W': 'warning',
    'C': 'convention',
    'R': 'refactor'
}
PYLINT_RC_FILE = os.path.abspath("papyros/pylint_config.rc")
PYLINT_PLUGINS = os.path.abspath("papyros/pylint_ast_checker")

def lint(file):
    # Ensure file content is correct
    MANAGER.astroid_cache.clear()
    pylint_output = StringIO()  # Custom open stream
    Run([
        "-j", "1", # ensure no parallellism is used as we don't have such resources in a worker
        "--rcfile", PYLINT_RC_FILE,
        '--load-plugins', PYLINT_PLUGINS,
        file], reporter=TextReporter(pylint_output), do_exit=False)
    return process_pylint_output(pylint_output.getvalue()) 

def process_pylint_output(linting_output):
    diagnostics = []
    for line in linting_output.split("\n"):
        line: str = line.rstrip()
        # filename:line:column: error_code: message (message-code)
        if line.count(":") == 4:
            _, line_nr, column_nr, code, message = line.rstrip().split(":")
            line_nr = int(line_nr)
            column_nr = int(column_nr)
            code = code.strip()
            first_bracket = message.index("(")
            # ignore message code for now
            message = message[:first_bracket-1]
            severity = MESSAGE_CATEGORIES[code[0]]
            diagnostics.append(
                {"lineNr": line_nr, "columnNr": column_nr, "severity": severity, "message": message}
            )
    return diagnostics
