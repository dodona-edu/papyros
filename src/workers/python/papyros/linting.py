def lint_code(file):
    from io import StringIO

    from pylint.lint import Run
    from pylint.reporters.text import TextReporter

    pylint_output = StringIO()  # Custom open stream
    reporter = TextReporter(pylint_output)
    Run(["-j", "1", file], reporter=reporter, do_exit=False)
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
            severity = "error" if code[0] == "E" else "warning"
            diagnostics.append(
                {"lineNr": line_nr, "columnNr": column_nr, "severity": severity, "message": message}
            )
    print("Lint output: ", linting_output)
    return diagnostics
