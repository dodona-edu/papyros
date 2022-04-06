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

class Papyros(python_runner.PyodideRunner):
    def __init__(
        self,
        *,
        source_code="",
        filename="/my_program.py",
        callback=None,
        limit=SYS_RECURSION_LIMIT
    ):
        if callback is None:
            raise ValueError("Callback must not be None")
        super().__init__(source_code=source_code, filename=filename)
        self.limit = limit
        self.override_globals()
        self.set_event_callback(callback)

    def set_event_callback(self, event_callback):
        def runner_callback(event_type, data):
            def cb(typ, dat, contentType=None, **kwargs):
                return event_callback(dict(type=typ, data=dat, contentType=contentType or "text/plain", **kwargs))

            if event_type == "output":
                for part in data["parts"]:
                    typ = part["type"]
                    if typ in ["stderr", "traceback", "syntax_error"]:
                        cb("error", part["text"], contentType=part.get("contentType"))
                    elif typ in ["input", "input_prompt"]:
                        # Do not display values entered by user for input
                        continue
                    else:
                        cb("output", part["text"], contentType=part.get("contentType"))
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
        self.override_flake()
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

    def override_flake(self):
        """
        Flake8 linter imports multiprocessing library, which is not fully supported in Pyodide
        These patches allow the imports to work so we can access the parts we need
        """
        import multiprocessing
        sys.modules["multiprocessing"].pool = multiprocessing.Pool
        # Importing multiprocessing.pool imports "_multiprocessing", so patch that too
        sys.modules["_multiprocessing"] = multiprocessing

    async def install_imports(self, source_code, ignore_missing=True):
        try:
            await install_imports(source_code)
        except ValueError:
            if not ignore_missing:
                raise

    def pre_run(self, source_code, mode="exec", top_level_await=False):
        self.override_globals()
        return super().pre_run(source_code, mode=mode, top_level_await=top_level_await)

    async def run_async(self, source_code, mode="exec", top_level_await=True):
        with self._execute_context():
            try:
                await self.install_imports(source_code, ignore_missing=False)
                code_obj = self.pre_run(source_code, mode=mode, top_level_await=top_level_await)
                if code_obj:
                    result = self.execute(code_obj, mode)
                    while isinstance(result, Awaitable):
                        result = await result
                    return result
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

    async def autocomplete(self, context):
        context = to_py(context)
        await self.install_imports(context["text"], ignore_missing=True)
        return await autocomplete(context)

    async def lint_code(self, code, lint_output_file="__papyros_output.txt"):
        self.set_source_code(code)
        if not code:
            return []
        await self.install_imports(code, ignore_missing=True)
        from flake8.main import application # Can only import after correct overrides
        linter = application.Application()
        linter.run(["--jobs", "1", "--output-file", lint_output_file, self.filename])
        result = self.process_linting_output(lint_output_file)
        os.remove(lint_output_file)
        return result

    def process_linting_output(self, lint_output_file):
        diagnostics = []
        for line in open(lint_output_file, "r"):
            _, line_nr, column_nr, error = line.rstrip().split(":")
            line_nr = int(line_nr)
            column_nr = int(column_nr)
            error = error.strip()
            first_space = error.index(" ")
            code, message = error[:first_space], error[first_space+1:]
            if "no newline at end of file" in message:
                column_nr -= 1
            severity = "error" if code[0] == "E" else "warning"
            diagnostics.append(
                {"lineNr": line_nr, "columnNr": column_nr, "severity": severity, "message": message}
            )
        return diagnostics
