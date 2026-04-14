import sys


class TurtleImportHook:
    """Import hook that lazily sets up SVG-based turtle graphics.

    Installed in sys.meta_path. When user code does `import turtle`,
    this hook intercepts it, imports svg-turtle, creates a shared
    canvas/screen, and patches the turtle module to render SVG.

    If user code never imports turtle, no setup occurs.
    """

    def __init__(self):
        self.papyros = None
        self.render = None
        self._loading = False
        self._turtle_module = None

    def find_spec(self, name, path, target=None):
        if name == 'turtle' and not self._loading:
            import importlib.util
            return importlib.util.spec_from_loader(name, self)
        return None

    def create_module(self, spec):
        return self._setup_turtle()

    def exec_module(self, module):
        pass

    def _setup_turtle(self):
        self._loading = True
        try:
            from svg_turtle import SvgTurtle
            from svg_turtle.canvas import Canvas

            if self._turtle_module is None:
                # First import: svg_turtle stubs tkinter, then imports turtle
                self._turtle_module = sys.modules.get('turtle')
                if self._turtle_module is None:
                    import turtle
                    self._turtle_module = sys.modules['turtle']

            turtle_mod = self._turtle_module
            sys.modules['turtle'] = turtle_mod

            # Fresh canvas and screen for this execution
            canvas = Canvas(400, 400)
            screen = SvgTurtle._Screen(canvas)
            screen.cv.config(bg="")

            class PapyrosTurtle(SvgTurtle):
                def __init__(self):
                    super().__init__(screen=screen)

            SvgTurtle._screen = screen
            SvgTurtle._pen = PapyrosTurtle()

            papyros = self.papyros

            def render():
                papyros._emit_turtle_snapshot()

            turtle_mod.Turtle = PapyrosTurtle
            turtle_mod.done = render
            turtle_mod.mainloop = render
            turtle_mod.exitonclick = render
            turtle_mod.bye = render

            self.render = render
            return turtle_mod
        except Exception:
            self.render = None
            return None
        finally:
            self._loading = False
