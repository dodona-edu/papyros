import builtins
import time
import os
import sys
import json
from collections.abc import Awaitable

import micropip
from pyodide import to_js

await micropip.install("python_runner")
import python_runner

# Install modules asynchronously to use when the user needs them
ft = micropip.install("friendly_traceback")
jedi_install = micropip.install("jedi")

SYS_RECURSION_LIMIT = 500

# Global Papyros instance
papyros = None

class Papyros(python_runner.PyodideRunner):
    def __init__(
        self,
        *,
        callback=None,
        limit=SYS_RECURSION_LIMIT
    ):
        super().__init__()
        self.limit = limit
        self.override_globals()
        self.set_event_callback(callback)

    def set_event_callback(self, event_callback):
        if event_callback is None:
            raise ValueError("Event callback must not be None")

        def runner_callback(event_type, data):
            def cb(typ, dat, **kwargs):
                return event_callback(to_js(dict(type=typ, data=dat, **kwargs)))

            # Translate python_runner events to papyros events
            if event_type == "output":
                for part in data["parts"]:
                    typ = part["type"]
                    if typ in ["stderr", "traceback", "syntax_error"]:
                        cb("error", part["text"], contentType="text/json")
                    elif typ == "stdout":
                        cb("output", part["text"], contentType="text/plain")
                    elif typ == "img":
                        cb("output", part["text"], contentType=part["contentType"])
                    elif typ in ["input", "input_prompt"]:
                        continue
                    else:
                        raise ValueError(f"Unknown output part type {typ}")
            elif event_type == "input":
                return cb("input", data["prompt"], contentType="text/plain")
            elif event_type == "sleep":
                return cb("sleep", str(data["seconds"]*1000), contentType="text/integer")
            else:
                raise ValueError(f"Unknown event type {event_type}")

        self.set_callback(runner_callback)

    def set_file(self, filename, code):
        self.filename = os.path.normcase(os.path.abspath(filename))
        with open(self.filename, "w") as f:
            f.write(code)

    def override_globals(self):
        # Code is executed in a worker with less resources than ful environment
        sys.setrecursionlimit(self.limit)
        # Otherwise `import matplotlib` fails while assuming a browser backend
        os.environ["MPLBACKEND"] = "AGG"
        sys.stdin.readline = self.readline
        builtins.input = self.input
        time.sleep = self.sleep
        try:
            import matplotlib
        except ModuleNotFoundError:
            pass
        else:
            # Only override matplotlib when required by the code
            self.override_matplotlib()

    def override_matplotlib(self):
        # workaround from https://github.com/pyodide/pyodide/issues/1518
        import base64
        from io import BytesIO
        import matplotlib.pyplot

        def show():
            buf = BytesIO()
            matplotlib.pyplot.savefig(buf, format="png")
            buf.seek(0)
            # encode to a base64 str
            img = base64.b64encode(buf.read()).decode("utf-8")
            matplotlib.pyplot.clf()
            self.output("img", img, contentType="img/png;base64")

        matplotlib.pyplot.show = show

    def pre_run(self, source_code, mode="exec", top_level_await=False):
        self.override_globals()
        return super().pre_run(source_code, mode=mode, top_level_await=top_level_await)

    def execute(self, code_obj, source_code, mode=None):  # noqa
        return eval(code_obj, self.console.locals)  # noqa

    async def run_async(self, source_code, mode="exec", top_level_await=True):
        """
        Mostly a copy of the parent `run_async` with some key differences
        We use `await ft` in case of an exception, because `serialize_traceback` isn't async.
        We call pre_run within to handle its exceptions within this try-block too
        As it will rethrow the SyntaxError (@see serialize_syntax_error)
        """
        with self._execute_context(source_code):
            try:
                code_obj = self.pre_run(
                    source_code, mode, top_level_await=top_level_await)
                if code_obj:
                    result = self.execute(code_obj, source_code, mode)
                    while isinstance(result, Awaitable):
                        result = await result
                    return result
            except:
                await ft
                # Let `_execute_context` and `serialize_traceback`
                # handle the exception
                raise

    def serialize_syntax_error(self, exc, source_code):
        raise  # Rethrow to ensure FriendlyTraceback library is imported correctly

    def serialize_traceback(self, exc, source_code):
        import friendly_traceback  # Delay import for faster startup
        from friendly_traceback.core import FriendlyTraceback

        # Allow friendly_traceback to inspect the code
        friendly_traceback.source_cache.cache.add(self.filename, source_code)

        # Initialize traceback
        fr = FriendlyTraceback(type(exc), exc, exc.__traceback__)
        fr.assign_generic()
        fr.assign_cause()
        # Translate properties to FriendlyError interface
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
        # Format for callback
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


async def init_papyros(event_callback, limit=SYS_RECURSION_LIMIT):
    global papyros
    papyros = Papyros(callback=event_callback, limit=limit)

async def process_code(code, filename="my_code.py"):
    papyros.set_file(filename, code)
    await papyros.run_async(code)

def convert_completion(completion, index):
    converted = dict(type=completion.type, label=completion.name_with_symbols)
    # if completion.get_signatures():
    #     converted["detail"] = completion.get_signatures()[0].description
    # converted["detail"] = f"{completion.parent().name} ({completion.type})" 
    if completion.type != "keyword":
        # Keywords have obvious meanings yet non-useful docstrings
        converted["info"] = completion.docstring().replace("\n", "\r\n")
    # Jedi does sorting, so give earlier element highest boost
    converted["boost"] = -index
    return converted

async def autocomplete(context):
    context = context.to_py()
    if context["before"]:
        before = context["before"]
    else:
        before = dict(text=None)
        before["from"] = context["pos"]

    complete_from = before["from"]
    if not context["explicit"] and \
         (context["before"] is not None and not context["before"]["text"]):
        # If user did not request completions, don't complete for the empty string
        options = []
    else:
        await jedi_install
        import jedi
        s = jedi.Script(context["text"])
        # Convert Jedi completions to CodeMirror objects
        options = [convert_completion(c, i)
                   for (i, c) in enumerate(s.complete(line=context["line"], column=context["column"]))]
        if "." in before["text"]:
            complete_from = before["to"]
    results = dict(options=json.dumps(options), contentType="text/json")
    results["from"] = complete_from
    return to_js(results)
