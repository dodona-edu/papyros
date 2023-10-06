import os
import sys
import json
import doctest
import re
import python_runner
import friendly_traceback

from friendly_traceback.core import FriendlyTraceback
from collections.abc import Awaitable
from contextlib import contextmanager, redirect_stdout, redirect_stderr
from pyodide_worker_runner import install_imports
from pyodide import JsException, create_proxy
from .util import to_py
from .autocomplete import autocomplete

SYS_RECURSION_LIMIT = 500

class Papyros(python_runner.PyodideRunner):
    def __init__(
        self,
        *,
        source_code="",
        filename="/my_program.py",
        callback=None,
        buffer_constructor=None,
        limit=SYS_RECURSION_LIMIT
    ):
        if callback is None:
            raise ValueError("Callback must not be None")
        if buffer_constructor is not None:
            self.OutputBufferClass = lambda f: buffer_constructor(create_proxy(f))
        super().__init__(source_code=source_code, filename=filename)
        self.limit = limit
        self.override_globals()
        self.set_event_callback(callback)

    def set_event_callback(self, event_callback):
        def runner_callback(event_type, data):
            def cb(typ, dat, contentType=None, **kwargs):
                return event_callback(dict(type=typ, data=dat, contentType=contentType or "text/plain", **kwargs))

            if event_type == "output":
                parts = data["parts"]
                if not isinstance(parts, list):
                    parts = [parts]
                for part in to_py(parts):
                    typ = part["type"]
                    data = part["text"] if "text" in part else part["data"]
                    if typ in ["stderr", "traceback", "syntax_error"]:
                        cb("error", data, contentType=part.get("contentType"))
                    elif typ in ["input", "input_prompt"]:
                        # Do not display values entered by user for input
                        continue
                    else:
                        cb("output", data, contentType=part.get("contentType"))
            elif event_type == "input":
                return cb("input", data["prompt"])
            elif event_type == "sleep":
                return cb("sleep", data["seconds"]*1000, contentType="application/number")
            else:
                return cb(event_type, data.get("data", ""), contentType=data.get("contentType"))

        self.set_callback(runner_callback)

    def override_globals(self):
        # Code is executed in a worker with less resources than ful environment
        sys.setrecursionlimit(self.limit)
        # Otherwise `import matplotlib` fails while assuming a browser backend
        os.environ["MPLBACKEND"] = "AGG"
        self.override_matplotlib()

    def override_matplotlib(self):
        try:
            # workaround from https://github.com/pyodide/pyodide/issues/1518
            import matplotlib.pyplot
            import base64
            from io import BytesIO
            

            def show():
                buf = BytesIO()
                matplotlib.pyplot.savefig(buf, format="png")
                buf.seek(0)
                # encode to a base64 str
                img = base64.b64encode(buf.read()).decode("utf-8")
                matplotlib.pyplot.clf()
                self.output("img", img, contentType="img/png;base64")

            matplotlib.pyplot.show = show
        except ModuleNotFoundError:
            pass

    async def install_imports(self, source_code, ignore_missing=True):
        try:
            await install_imports(source_code, self.import_callback)
        except (ValueError, JsException):
            # Notify of import failure
            self.callback("loading", data=dict(status="failed", modules=[]), contentType="application/json")
            # Occurs when trying to fetch PyPi files for misspelled imports
            if not ignore_missing:
                raise

    def import_callback(self, typ, modules):
        if typ in ["loading_one", "loaded_all"]:
            # Can ignore these types and focus on loading_all and loaded_one
            return
        status = "loading" if "loading" in typ else "loaded"
        if not isinstance(modules, list):
            modules = [modules]
        module_names = [mod["module"] for mod in modules]
        self.callback("loading", data=dict(status=status, modules=module_names), contentType="application/json")
                
    @contextmanager
    def _execute_context(self):
        with (
            redirect_stdout(python_runner.output.SysStream("output", self.output_buffer)),
            redirect_stderr(python_runner.output.SysStream("error", self.output_buffer)),
        ):
            try:
                yield
            except BaseException as e:
                self.output("traceback", **self.serialize_traceback(e))
        self.post_run()

    def pre_run(self, source_code, mode="exec", top_level_await=False):
        self.override_globals()
        if mode == "doctest":
            # remove if __name__ == "__main__" and replace it
            lines = source_code.split("\n")
            main_start = 0
            while main_start < len(lines) and not re.match("^if(\s)+__name__(\s)*==(\s)*\"__main__\"(\s)*:", lines[main_start]):
                main_start += 1
            if main_start < len(lines):
                # Strip away indented lines making up the main block
                main_end = main_start + 1
                while main_end < len(lines) and re.match("^(( |\t)+)", lines[main_end]):
                    main_end += 1
                source_code = "\n".join(lines[0:main_start] + lines[main_end:])
            source_code += "\nif __name__ == \"__main__\":\n    import doctest\n    doctest.testmod(verbose=True)"
        return super().pre_run(source_code, mode=mode, top_level_await=top_level_await)

    async def run_async(self, source_code, mode="exec", top_level_await=True):
        with self._execute_context():
            try:
                code_obj = self.pre_run(source_code, mode=mode, top_level_await=top_level_await)
                if code_obj:
                    self.callback("start", data="RunCode", contentType="text/plain")
                    if mode == "debug":
                        from tracer import JSONTracer
                        result = JSONTracer(False, False, False).runscript(source_code)
                    else:
                        result = self.execute(code_obj, mode)
                    while isinstance(result, Awaitable):
                        result = await result
                    self.callback("end", data="CodeFinished", contentType="text/plain")
                    return result
            except ModuleNotFoundError as mnf:
                # Try to automatically install missing dependencies
                # As they sometimes might be hidden within libraries
                try:
                    await self.install_imports([mnf.name], ignore_missing=False)
                except:
                    # If the module is truly not findable, raise the error again
                    raise mnf
                return await self.run_async(source_code, mode=mode, top_level_await=top_level_await)
            except BaseException as e:
                # Sometimes KeyboardInterrupt is caught by Pyodide and raised as a PythonError
                # with a js_error containing the reason
                js_error = str(getattr(e, "js_error", ""))
                if isinstance(e, KeyboardInterrupt) or "KeyboardInterrupt" in js_error:
                    self.callback("interrupt", data="KeyboardInterrupt", contentType="text/plain")
                else:
                    raise
                
    def serialize_syntax_error(self, exc):
        raise  # Rethrow to ensure FriendlyTraceback library is imported correctly

    def serialize_traceback(self, exc):
        # Allow friendly_traceback to inspect the code
        friendly_traceback.source_cache.cache.add(self.filename, self.source_code)

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

    def autocomplete(self, context):
        context = to_py(context)
        self.set_source_code(context["text"])
        return autocomplete(context)

    def lint(self, code):
        # PyLint runs into an issue when trying to import its dependencies
        # Temporarily overriding os.devnull solves this issue
        TEMP_DEV_NULL = "__papyros_dev_null"
        with open(TEMP_DEV_NULL, "w") as f:
            pass
        orig_dev_null = os.devnull
        os.devnull = TEMP_DEV_NULL

        self.set_source_code(code)
        from .linting import lint
        os.devnull = orig_dev_null
        return lint(code)

    def has_doctests(self, code):
        parser = doctest.DocTestParser()
        tests = parser.get_examples(code)
        return bool(tests)
