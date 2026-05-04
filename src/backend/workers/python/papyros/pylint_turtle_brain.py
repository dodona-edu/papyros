# Astroid brain plugin for Python's turtle module.
# turtle.py creates module-level functions dynamically via exec() in
# _make_global_funcs(), so astroid can't see them statically.
# This plugin injects stubs for those functions so pylint can check
# valid vs invalid member access (e.g. turtle.forward is OK,
# turtle.test is not).

import astroid
from astroid import MANAGER

# These lists mirror CPython 3.13's turtle._tg_turtle_functions and
# turtle._tg_screen_functions — the functions generated at module level.
_TG_TURTLE_FUNCTIONS = [
    'back', 'backward', 'begin_fill', 'begin_poly', 'bk',
    'circle', 'clear', 'clearstamp', 'clearstamps', 'clone', 'color',
    'degrees', 'distance', 'dot', 'down', 'end_fill', 'end_poly', 'fd',
    'fillcolor', 'filling', 'forward', 'get_poly', 'getpen', 'getscreen',
    'getturtle', 'goto', 'heading', 'hideturtle', 'home', 'ht', 'isdown',
    'isvisible', 'left', 'lt', 'onclick', 'ondrag', 'onrelease', 'pd',
    'pen', 'pencolor', 'pendown', 'pensize', 'penup', 'pos', 'position',
    'pu', 'radians', 'right', 'reset', 'resizemode', 'rt', 'seth',
    'setheading', 'setpos', 'setposition', 'settiltangle',
    'setundobuffersize', 'setx', 'sety', 'shape', 'shapesize',
    'shapetransform', 'shearfactor', 'showturtle', 'speed', 'st', 'stamp',
    'teleport', 'tilt', 'tiltangle', 'towards', 'turtlesize', 'undo',
    'undobuffercount', 'up', 'width', 'write', 'xcor', 'ycor',
]

_TG_SCREEN_FUNCTIONS = [
    'addshape', 'bgcolor', 'bgpic', 'bye', 'clearscreen', 'colormode',
    'delay', 'exitonclick', 'getcanvas', 'getshapes', 'listen',
    'mainloop', 'mode', 'numinput', 'onkey', 'onkeypress', 'onkeyrelease',
    'onscreenclick', 'ontimer', 'register_shape', 'resetscreen',
    'screensize', 'setup', 'setworldcoordinates', 'textinput', 'title',
    'tracer', 'turtles', 'update', 'window_height', 'window_width', 'done',
]

_ALL_FUNCTIONS = _TG_TURTLE_FUNCTIONS + _TG_SCREEN_FUNCTIONS


def _turtle_transform(module):
    """Add stub definitions for turtle's dynamically generated functions."""
    code = "\n".join(f"def {name}(*args, **kwargs): ..." for name in _ALL_FUNCTIONS)
    fake = astroid.parse(code)
    for node in fake.body:
        module.body.append(node)
        module.locals[node.name] = [node]


MANAGER.register_transform(
    astroid.Module,
    _turtle_transform,
    lambda node: node.name == 'turtle',
)


def register(linter):
    """Required by pylint plugin interface (no checkers to register)."""
    pass
