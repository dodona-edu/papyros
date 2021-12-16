export const INITIALIZE_PYTHON_BACKEND = "__init_papyros";
export const RUN_PYTHON_CODE = "__run_code";
export const INITIALIZATION_CODE =
    `
from pyodide import to_js, eval_code_async
import sys
import json
import micropip
await micropip.install('friendly_traceback')
import friendly_traceback

__papyros = None

class __Papyros():
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
        class __OutputWriter:
            def __init__(self, type, on_write):
                self.encoding = "utf-8"
                self.type = type
                self.on_write = on_write
                
            def write(self, s):
                self.on_write(dict(type=self.type, data=s))

            def flush(self):
                pass # Given data is always immediately written
        on_write = lambda d: self.message(d)
        sys.stdout = __OutputWriter("output", on_write)
        sys.stderr = __OutputWriter("error", on_write)

    def readline(self, n=-1, prompt=""):
        if not self.line:
            self.line = self.message(dict(type="input", data=prompt)) + "\\n"
        if n < 0 or n > len(self.line):
            n = len(self.line)
        to_return = self.line[0:n]
        self.line = self.line[n:]
        return to_return

    def override_input(self):
        global input
        input = lambda prompt="": self.readline(prompt=prompt)[:-1] # Remove newline

        sys.stdin.readline = self.readline

def clean_filename(filename, tb):
    for prefix in ["\\"", " "]:
        tb = tb.replace(prefix + filename[1:], prefix + filename)
    return tb

def format_exception(filename, exc):
    friendly_traceback.set_stream("capture")
    friendly_traceback.explain_traceback()
    ftb = friendly_traceback.get_output()
    # For some reason __file__ data loses its first symbol?
    ftb = clean_filename(filename, ftb)
    parts = ftb.split("\\n\\n")
    summary = parts[0]
    info = parts[1]
    where = parts[2]
    what = parts[3]
    summary = summary.split("\\n")
    i = 0
    while i < len(summary) and filename not in summary[i]:
        i += 1
    summary = "\\n".join(summary[i:])
    return json.dumps(
        dict(
            summary=summary,
            info=info,
            where=where,
            what=what
        )
    )

def ${INITIALIZE_PYTHON_BACKEND}(cb):
    globals()["__name__"] = "__main__"
    global __papyros
    __papyros = __Papyros(cb)

async def ${RUN_PYTHON_CODE}(code, filename="my_code.py"):
    with open(filename, "w") as f:
        f.write(code)
    globals()["__file__"] = filename
    try:
        return await eval_code_async(code, globals(), filename=filename)
    except Exception as e:
        global __papyros
        __papyros.message(dict(type="error", data=format_exception(filename, e)))

`;
