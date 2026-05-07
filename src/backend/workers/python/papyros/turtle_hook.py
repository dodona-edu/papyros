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
                # svg_turtle stubs tkinter as a side effect of import; must precede `import turtle`
                import turtle
                self._turtle_module = sys.modules['turtle']

            turtle_mod = self._turtle_module
            sys.modules['turtle'] = turtle_mod

            canvas = Canvas(400, 400)
            screen = SvgTurtle._Screen(canvas)
            screen.cv.config(bg="")

            class PapyrosTurtle(SvgTurtle):
                def __init__(self):
                    super().__init__(screen=screen)

            SvgTurtle._screen = screen
            SvgTurtle._pen = PapyrosTurtle()

            def render():
                self.papyros._emit_turtle_snapshot()

            def setup(width=400, height=400, startx=None, starty=None):
                # Mirror stdlib turtle: floats in (0, 1] are a fraction of the
                # screen. Papyros has no real screen, so resolve fractions
                # against a 1000px reference.
                def resolve(value):
                    if isinstance(value, float) and 0 < value <= 1:
                        return int(value * 1000)
                    v = int(value)
                    if v <= 0:
                        raise ValueError(f"turtle.setup() requires positive dimensions, got {value!r}")
                    return v
                canvas.options['width'] = resolve(width)
                canvas.options['height'] = resolve(height)

            turtle_mod.Turtle = PapyrosTurtle
            turtle_mod.done = render
            turtle_mod.mainloop = render
            turtle_mod.exitonclick = render
            turtle_mod.bye = render
            turtle_mod.setup = setup

            self.render = render
            return turtle_mod
        finally:
            self._loading = False
