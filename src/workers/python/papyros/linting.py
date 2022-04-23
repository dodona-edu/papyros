import os
from io import StringIO

# define categories used for pylint messages
MESSAGE_CATEGORIES = {
    'F': 'fatal',
    'E': 'error',
    'W': 'warning',
    'C': 'convention',
    'R': 'refactor'
}

PYLINT_RC_FILE = os.path.abspath("papyros/pylint_config.rc")
def lint_code(file):
    # Delay import until patches are applied at the call site
    from pylint.lint import Run
    from pylint.reporters.text import TextReporter
    from astroid import MANAGER
    # Ensure file content is correct
    MANAGER.astroid_cache.clear()
    pylint_output = StringIO()  # Custom open stream
    reporter = TextReporter(pylint_output)
    Run(["-j", "1", "--rcfile", PYLINT_RC_FILE, file], reporter=reporter, do_exit=False)
    return process_linting_output(pylint_output.getvalue()) 

def process_linting_output(linting_output):
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
            severity = MESSAGE_CATEGORIES[code[0]] # "error" if code[0] == "E" else "warning"
            diagnostics.append(
                {"lineNr": line_nr, "columnNr": column_nr, "severity": severity, "message": message}
            )
    print("Lint output: ", linting_output)
    print("Obtained diagnostics: ", diagnostics)
    return diagnostics
