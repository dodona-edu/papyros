export const INITIALIZATION_CODE =
    `
from pyodide import to_js
import sys

def __override_builtins(cb):
    __capture_stdout(cb)
    __override_stdin(cb)

def __capture_stdout(cb):
    class _OutputWriter:

        def write(self, s):
            cb(to_js({"type": "output", "data":s}))

        def flush(self):
            pass # Given data is always immediately written

    global print
    __original_print = print
    __writer = _OutputWriter()

    def __dodona_print(*objects, sep=' ', end='\\n', file=sys.stdout, flush=False):
        if file == sys.stdout:
            __original_print(*objects, sep=sep, end=end, file=__writer, flush=flush)
        else:
            __original_print(*objects, sep=sep, end=end, file=file, flush=flush)

    print = __dodona_print

def __override_stdin(cb):
    global input
    def __dodona_input(prompt=""):
        print(prompt, end="")
        user_value = cb(to_js({"type": "input", "data":prompt}))
        print(user_value)
        return user_value

    input = __dodona_input

def __run_code(code):
    return exec(code, dict(globals()))
`;
