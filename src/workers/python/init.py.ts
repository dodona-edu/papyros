export const INITIALIZE_PYTHON_BACKEND = "__init_papyros";
export const PROCESS_PYTHON_CODE = "__process_code";
export const INITIALIZATION_CODE =
    `
from pyodide import to_js, eval_code_async
from js import console
import sys
import ast
import json
import html
import types
import os
import micropip
await micropip.install('friendly_traceback')
import friendly_traceback
from friendly_traceback.core import FriendlyTraceback

papyros = None

class Papyros():
    def __init__(self, cb):
        self.cb = cb
        self.line = ""
        self.override_builtins()

    def message(self, data):
        return self.cb(to_js(data))

    def override_builtins(self):
        self.override_output()
        self.override_input()

    def override_output(self):
        class OutputWriter:
            def __init__(self, type, on_write, original):
                self.encoding = "utf-8"
                self.type = type
                self.on_write = on_write
                self.original = original
                
            def write(self, s):
                if isinstance(s, bytes):
                    s = s.decode("utf8", "replace")
                self.on_write(dict(type=self.type, data=s))

            def flush(self):
                pass # Given data is always immediately written

            def __getattr__(self, item):
                return getattr(self.original, item)

        on_write = lambda d: self.message(d)
        sys.stdout = OutputWriter("output", on_write, sys.stdout)
        sys.stderr = OutputWriter("error", on_write, sys.stderr)

    def readline(self, n=-1, prompt=""):
        if not self.line:
            self.line = self.message(dict(type="input", data=prompt)) + "\\n"
        if n < 0 or n > len(self.line):
            n = len(self.line)
        to_return = self.line[0:n]
        self.line = self.line[n:]
        return to_return

    def globals(self, filename):
        mod = types.ModuleType("__main__")
        mod.__file__ = filename
        sys.modules["__main__"] = mod
        return mod.__dict__

    def override_input(self):
        sys.stdin.readline = self.readline
        import builtins
        builtins.input = lambda prompt="": self.readline(prompt=prompt)[:-1] # Remove newline

def format_exception(filename, exc):
    fr = FriendlyTraceback(type(exc), exc, exc.__traceback__)
    fr.assign_generic()
    fr.assign_cause()
    tb = fr.info.get("shortened_traceback", "No traceback")
    info = fr.info.get("generic", "No information available.")
    why = fr.info.get("cause", "Unknown cause")
    what = fr.info.get("message", "No message")
    user_start = 0
    tb_lines = tb.split("\\n")
    while user_start < len(tb_lines) and filename not in tb_lines[user_start]:
        user_start += 1
    name = type(exc).__name__
    user_end = user_start + 1
    while user_end < len(tb_lines) and name not in tb_lines[user_end]:
        user_end += 1
    where = "\\n".join(tb_lines[user_start:user_end]) or "No location"
    return json.dumps(
        dict(
            name=name,
            traceback=tb,
            info=info,
            why=why,
            where=where,
            what=what
        )
    )

def ${INITIALIZE_PYTHON_BACKEND}(cb):
    global papyros
    papyros = Papyros(cb)

async def ${PROCESS_PYTHON_CODE}(code, filename="my_code.py"):
    with open(filename, "w") as f:
        f.write(code)
    friendly_traceback.source_cache.cache.add(filename, code)
    try:
        await eval_code_async(code, papyros.globals(filename),
                filename=filename, return_mode="none")
    except Exception as e:
        papyros.message(dict(type="error", data=format_exception(filename, e)))

`;
