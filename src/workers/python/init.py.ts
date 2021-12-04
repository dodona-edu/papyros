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

__papyros_input = ""
def __override_stdin(cb):
    def __papyros_readline(n=-1):
        global __papyros_input
        if not __papyros_input:
            __papyros_input = cb(to_js({"type": "input", "data":"next line"})) + "\\n"
        if n < 0 or n > len(__papyros_input):
            n = len(__papyros_input)
        to_return = __papyros_input[0:n]
        __papyros_input = __papyros_input[n:]
        return to_return

    sys.stdin.readline = __papyros_readline
`;
