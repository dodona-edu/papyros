import sys
import json
import os
from collections.abc import Awaitable

import micropip
from pyodide import to_js

await micropip.install("python_runner")
import python_runner

ft = micropip.install("friendly_traceback")
jedi_install = micropip.install("jedi")
# Otherwise `import matplotlib` fails while assuming a browser backend
os.environ["MPLBACKEND"] = "AGG"

# Code is executed in a worker with less resources than ful environment
sys.setrecursionlimit(500)

# Global Papyros instance
papyros = None


class Papyros(python_runner.PatchedStdinRunner):
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

    async def run_async(self, source_code, mode="exec", top_level_await=True):
        """
        Mostly a copy of the parent `run_async` with `await ft` in case of an exception,
        because `serialize_traceback` isn't async.
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


def init_papyros(event_callback):
    global papyros

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
            return cb("input", json.dumps(dict(prompt=data["prompt"])), contentType="text/json")
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
        # Only override matplotlib when required by the code
        papyros.override_matplotlib()

    await papyros.run_async(code)

def convert_completion(completion, index):
    converted = dict(type=completion.type, label=completion.name_with_symbols)
    if completion.get_signatures():
        converted["detail"] = completion.get_signatures()[0].description
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
