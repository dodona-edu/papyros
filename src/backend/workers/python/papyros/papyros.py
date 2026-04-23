import builtins
import functools
import io
import os
import shutil
import sys
import json
import base64
import doctest
import re
import python_runner
import friendly_traceback

from friendly_traceback.core import FriendlyTraceback
from collections.abc import Awaitable
from contextlib import contextmanager, redirect_stdout, redirect_stderr
from pyodide_worker_runner import install_imports
from pyodide.ffi import JsException, create_proxy
from .util import to_py
from .turtle_hook import TurtleImportHook
from pyodide.http import pyfetch
from types import ModuleType

SYS_RECURSION_LIMIT = 500
MODULE_NAME = "sandbox"


class Papyros(python_runner.PyodideRunner):
    def __init__(
        self,
        *,
        source_code="",
        filename="/__main__.py",
        callback=None,
        buffer_constructor=None,
        limit=SYS_RECURSION_LIMIT
    ):
        if callback is None:
            raise ValueError("Callback must not be None")
        if buffer_constructor is not None:
            self.OutputBufferClass = lambda f: buffer_constructor(create_proxy(f))
        super().__init__(source_code=source_code, filename=filename)
        self.workspace = "/home/pyodide/workspace"
        if os.path.exists(self.workspace):
            shutil.rmtree(self.workspace)
        os.makedirs(self.workspace)
        os.chdir(self.workspace)
        self._tracked_files = set()
        self._tracking_files = False
        self._original_open = builtins.open
        self._last_emitted_snapshot = None
        self._last_emitted_turtle_svg = None
        self._turtle_hook = TurtleImportHook()
        self._install_open_tracking()
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
                self._emit_turtle_snapshot()
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
        self.override_turtle()

    def _emit_turtle_snapshot(self):
        if not self._turtle_hook.render:
            return
        from svg_turtle import SvgTurtle
        svg_string = SvgTurtle._pen.to_svg()
        if svg_string and svg_string != self._last_emitted_turtle_svg:
            self._last_emitted_turtle_svg = svg_string
            img = base64.b64encode(svg_string.encode("utf-8")).decode("utf-8")
            self.callback("turtle", data=img, contentType="image/svg+xml;base64")

    def override_turtle(self):
        hook = self._turtle_hook
        hook.papyros = self
        hook.render = None
        # Remove turtle from sys.modules so the hook intercepts the next import
        sys.modules.pop('turtle', None)
        if hook not in sys.meta_path:
            sys.meta_path.insert(0, hook)

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

    def _install_open_tracking(self):
        papyros = self

        @functools.wraps(self._original_open)
        def tracked_open(*args, **kwargs):
            f = papyros._original_open(*args, **kwargs)
            if papyros._tracking_files:
                papyros._tracked_files.add(f)
            return f

        builtins.open = tracked_open

    @contextmanager
    def _without_file_tracking(self):
        was_tracking = self._tracking_files
        self._tracking_files = False
        try:
            yield
        finally:
            self._tracking_files = was_tracking

    def _flush_open_files(self):
        closed = set()
        for f in self._tracked_files:
            if f.closed:
                closed.add(f)
            else:
                try:
                    f.flush()
                except Exception:
                    pass
        self._tracked_files -= closed

    def _emit_created_files(self):
        with self._without_file_tracking():
            cwd = os.getcwd()
            result = {}
            try:
                for dirpath, dirnames, filenames in os.walk(cwd):
                    for filename in filenames:
                        try:
                            path = os.path.join(dirpath, filename)
                            size = os.path.getsize(path)
                            if size > 1024 * 1024:
                                continue
                            key = os.path.relpath(path, cwd)
                            try:
                                with open(path, "r", encoding="utf-8") as f:
                                    content = f.read()
                                result[key] = {"content": content, "binary": False}
                            except (UnicodeDecodeError, IOError):
                                with open(path, "rb") as f:
                                    content = base64.b64encode(f.read()).decode("ascii")
                                result[key] = {"content": content, "binary": True}
                        except Exception:
                            continue
            except Exception:
                return
            snapshot = json.dumps(result, sort_keys=True)
            if snapshot == self._last_emitted_snapshot:
                return
            self._last_emitted_snapshot = snapshot
            self.callback("files", data=snapshot, contentType="text/json")

    @contextmanager
    def _execute_context(self):
        self._tracked_files.clear()
        self._tracking_files = True
        self._last_emitted_snapshot = None
        self._last_emitted_turtle_svg = None
        with (
            redirect_stdout(python_runner.output.SysStream("output", self.output_buffer)),
            redirect_stderr(python_runner.output.SysStream("error", self.output_buffer)),
        ):
            try:
                yield
            except BaseException as e:
                self.output("traceback", **self.serialize_traceback(e))
                self._flush_open_files()
                self._emit_created_files()
                self._emit_turtle_snapshot()
            finally:
                self._tracking_files = False
        self.post_run()

    def pre_run(self, source_code, mode="exec", top_level_await=False):
        self.override_globals()
        if mode == "doctest":
            source_code += f"""
if __name__ == "{MODULE_NAME}":
    import doctest
    import sys
    doctest.testmod(m=sys.modules["{MODULE_NAME}"], verbose=True)
"""
        return super().pre_run(source_code, mode=mode, top_level_await=top_level_await)

    async def run_async(self, source_code, mode="exec", top_level_await=True):
        with self._execute_context():
            try:
                code_obj = self.pre_run(source_code, mode=mode, top_level_await=top_level_await)
                if code_obj:
                    self.callback("start", data="RunCode", contentType="text/plain")
                    if mode == "debug":
                        from tracer import JSONTracer

                        def frame_callback(frame):
                            self._flush_open_files()
                            self._emit_created_files()
                            self._emit_turtle_snapshot()
                            self.callback("frame", data=frame, contentType="application/json")

                        result = JSONTracer(frame_callback=frame_callback, module_name=MODULE_NAME).runscript(source_code)
                    else:
                        result = self.execute(code_obj, mode)
                    while isinstance(result, Awaitable):
                        result = await result
                    self._flush_open_files()
                    self._emit_created_files()
                    self._emit_turtle_snapshot()
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
                    self._emit_turtle_snapshot()
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

    def lint(self, code):
        with self._without_file_tracking():
            self.set_source_code(code)
            from .linting import lint
            return lint(code)

    def has_doctests(self, code):
        parser = doctest.DocTestParser()
        try:
            tests = parser.get_examples(code)
            return bool(tests)
        except ValueError:
            return False

    def _safe_path(self, name):
        base = os.path.realpath(self.workspace)
        target = os.path.realpath(os.path.join(base, name))
        if target != base and not target.startswith(base + os.sep):
            raise ValueError(f"Path escapes workspace: {name}")
        return target

    def _safe_writable_path(self, name):
        path = self._safe_path(name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        return path

    def _cleanup_empty_dirs(self, dirpath):
        base = os.path.realpath(self.workspace)
        dirpath = os.path.realpath(dirpath)
        if dirpath == base or not dirpath.startswith(base + os.sep):
            return
        try:
            os.rmdir(dirpath)
        except OSError:
            return
        self._cleanup_empty_dirs(os.path.dirname(dirpath))

    def delete_file(self, name):
        path = self._safe_path(name)
        os.remove(path)
        self._cleanup_empty_dirs(os.path.dirname(path))

    def rename_file(self, old_name, new_name):
        with self._without_file_tracking():
            old_path = self._safe_path(old_name)
            new_path = self._safe_writable_path(new_name)
            os.rename(old_path, new_path)
            self._cleanup_empty_dirs(os.path.dirname(old_path))

    def update_file(self, name, content, binary=False):
        with self._without_file_tracking():
            path = self._safe_writable_path(name)
            if binary:
                with open(path, "wb") as f:
                    f.write(base64.b64decode(content))
            else:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)

    async def provide_files(self, inline_files, href_files):
        with self._without_file_tracking():
            inline_files = json.loads(inline_files)
            for f in inline_files:
                path = self._safe_writable_path(f)
                with open(path, "w") as fd:
                    fd.write(inline_files[f])
                self.callback("loading", data=dict(status="loaded", modules=[f]), contentType="application/json")

            href_files = json.loads(href_files)
            for f in href_files:
                url = href_files[f]
                path = self._safe_writable_path(f)
                r = await pyfetch(url, stream=True)
                with open(path, "wb") as fd:
                    fd.write(await r.bytes())
                self.callback("loading", data=dict(status="loaded", modules=[f]), contentType="application/json")

            self._emit_created_files()

    def reset(self):
        """
        overwritten from PyodideRunner to change the module name
        """
        super().reset()
        mod = ModuleType(MODULE_NAME)
        mod.__file__ = self.filename
        sys.modules[MODULE_NAME] = mod
        self.console.locals = mod.__dict__

