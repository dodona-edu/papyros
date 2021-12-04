export const INITIALIZATION_CODE =
    `
from pyodide import to_js
import sys

def __override_builtins(cb):
    __capture_stdout(cb)
    __override_stdin(cb)
    # set name to main instead of builtins
    globals()["__name__"] = "__main__"

def __capture_stdout(cb):
    class _OutputWriter:
        def __init__(self):
            self.encoding = "utf-8"
            
        def write(self, s):
            cb(to_js({"type": "output", "data":s}))

        def flush(self):
            pass # Given data is always immediately written

    sys.stdout = _OutputWriter()

def __override_stdin(cb):
    def __papyros_readline():
        user_value = cb(to_js({"type": "input", "data":"next line"}))
        print(user_value, type(user_value))
        return user_value

    sys.stdin.readline = __papyros_readline
`;
