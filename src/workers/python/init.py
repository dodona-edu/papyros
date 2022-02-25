import json
import os
from collections.abc import Awaitable

import micropip
from pyodide import to_js

await micropip.install("python_runner")
import python_runner

ft = micropip.install('friendly_traceback')

# Otherwise `import matplotlib` fails while assuming a browser backend
os.environ['MPLBACKEND'] = 'AGG'

# Code is executed in a worker with less resources than ful environment
import sys
sys.setrecursionlimit(500)

papyros = None


class Papyros(python_runner.PatchedStdinRunner):
    def override_matplotlib(self):
        # workaround from https://github.com/pyodide/pyodide/issues/1518
        import base64
        from io import BytesIO
        import matplotlib.pyplot

        def show():
            buf = BytesIO()
            matplotlib.pyplot.savefig(buf, format='png')
            buf.seek(0)
            # encode to a base64 str
            img = base64.b64encode(buf.read()).decode('utf-8')
            matplotlib.pyplot.clf()
            self.output("img", img)

        matplotlib.pyplot.show = show

    async def run_async(self, source_code, mode="exec", top_level_await=True):
        """
        Mostly a copy of the parent `run_async` with `await ft` in case of an exception,
        because `serialize_traceback` isn't async.
        """
        try: 
            print("Compiling!")
            code_obj = self.pre_run(source_code, mode, top_level_await=top_level_await)
            with self._execute_context(source_code):
                if code_obj:
                    result = self.execute(code_obj, source_code, mode)
                    while isinstance(result, Awaitable):
                        result = await result
                    return result
        except: # Also catch compilation errors
            print("Caught error, so awaiting?")
            await ft
            print("Await done")
            # Let `_execute_context` and `serialize_traceback`
            # handle the exception
            raise

    def serialize_traceback(self, exc, source_code):
        print("In serialize traceback")
        import friendly_traceback
        from friendly_traceback.core import FriendlyTraceback

        friendly_traceback.source_cache.cache.add(self.filename, source_code)

        fr = FriendlyTraceback(type(exc), exc, exc.__traceback__)
        fr.assign_generic()
        fr.assign_cause()
        tb = fr.info.get("shortened_traceback", "")
        info = fr.info.get("generic", "")
        why = fr.info.get("cause", "")
        what = fr.info.get("message", "")

        name = type(exc).__name__
        user_start = 0
        tb_lines = tb.split("\n")
        # Find first line in traceback that involves code from the user
        while user_start < len(tb_lines) and self.filename not in tb_lines[user_start]:
            user_start += 1
        # Find line containing Exception name, denoting end of location of issue
        user_end = user_start + 1
        while user_end < len(tb_lines) and name not in tb_lines[user_end]:
            user_end += 1
        where = "\n".join(tb_lines[user_start:user_end]) or ""
        return dict(
            text=json.dumps(
                dict(
                    name=name,
                    traceback=tb,
                    info=info,
                    why=why,
                    where=where,
                    what=what
                )
            )
        )


def init_papyros(eventCallback):
    global papyros
    def runner_callback(event_type, data):
        def cb(typ, dat, **kwargs):
            return eventCallback(to_js(dict(type=typ, data=dat, **kwargs)))

        # Translate python_runner events to papyros events
        if event_type == "output":
            for part in data["parts"]:
                if part["type"] in ["stderr", "traceback", "syntax_error"]:
                    cb("error", part["text"])
                elif part["type"] == "stdout":
                    cb("output", part["text"])
                elif part["type"] == "img":
                    cb("output", part["text"], content="img")
                elif part["type"] in ["input", "input_prompt"]:
                    continue
                else:
                    raise ValueError(f"Unknown output part type {part['type']}")
        elif event_type == "input":
            return cb("input", data["prompt"])
        else:
            raise ValueError(f"Unknown event type {event_type}")

    papyros = Papyros(callback=runner_callback)


async def process_code(code, filename="my_code.py"):
    with open(filename, "w") as f:
        f.write(code)
    papyros.filename = filename

    try:
        import matplotlib
    except ModuleNotFoundError:
        pass
    else:
        papyros.override_matplotlib()

    await papyros.run_async(code)
