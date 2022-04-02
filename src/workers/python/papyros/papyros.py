import builtins
import time
import os
import sys
import json
import python_runner
import friendly_traceback

from friendly_traceback.core import FriendlyTraceback
from collections.abc import Awaitable
from pyodide_worker_runner import install_imports


from .util import to_py
from .autocomplete import autocomplete

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
        if callback is None:
            raise ValueError("Callback must not be None")
        super().__init__()
        self.limit = limit
        self.override_globals()
        self.set_event_callback(callback)

    def set_event_callback(self, event_callback):
        def runner_callback(event_type, data):
            def cb(typ, dat, **kwargs,):
                return event_callback(dict(type=typ, data=dat, **kwargs))

            # Translate python_runner events to Papyros events
            if event_type == "output":
                for part in data["parts"]:
                    typ = part["type"]
                    if typ in ["stderr", "traceback", "syntax_error"]:
                        cb("error", part["text"], contentType=part.get("contentType", "text/plain"))
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
                return cb("sleep", data["seconds"]*1000, contentType="application/number")
            elif event_type == "interrupt":
                return cb("interrupt", data["data"], contentType="text/plain")
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

    async def install_imports(self, source_code, ignore_missing=True):
        try:
            await install_imports(source_code)
        except ValueError:
            if not ignore_missing:
                raise

    def pre_run(self, source_code, mode="exec", top_level_await=False):
        self.override_globals()
        return super().pre_run(source_code, mode=mode, top_level_await=top_level_await)

    def execute(self, code_obj, source_code, mode=None):  # noqa
        return eval(code_obj, self.console.locals)  # noqa

    async def run_async(self, source_code, mode="exec", top_level_await=True, filename="my_code.py"):
        """
        Mostly a copy of the parent `run_async` with some key differences
        We use `await ft` in case of an exception, because `serialize_traceback` isn't async.
        We call pre_run within to handle its exceptions within this try-block too
        As it will rethrow the SyntaxError (@see serialize_syntax_error)
        """
        self.set_file(filename, source_code)
        try:
            with self._execute_context(source_code):
                try:
                    await self.install_imports(source_code, ignore_missing=False)
                    code_obj = self.pre_run(
                        source_code, mode, top_level_await=top_level_await)
                    if code_obj:
                        result = self.execute(code_obj, source_code, mode)
                        while isinstance(result, Awaitable):
                            result = await result
                        return result
                except:
                    # Let `_execute_context` and `serialize_traceback`
                    # handle the exception
                    raise
        except KeyboardInterrupt:
            self.callback("interrupt", data="KeyboardInterrupt", contentType="text/plain")

    def serialize_syntax_error(self, exc, source_code):
        raise  # Rethrow to ensure FriendlyTraceback library is imported correctly

    def serialize_traceback(self, exc, source_code):
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
            text=json.dumps(dict(
                    name=name,
                    traceback=tb,
                    info=info,
                    why=why,
                    where=where,
                    what=what
                )),
            contentType="text/json"
        )

    async def autocomplete(self, context):
        context = to_py(context)
        await self.install_imports(context["text"], ignore_missing=True)
        return await autocomplete(context)
