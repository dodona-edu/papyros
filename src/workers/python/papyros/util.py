import json
from pyodide import to_js

def to_py(arg):
    if arg.to_py:
        arg = arg.to_py()
    return arg

def js_python(f):
    def wrapped(*args, **kwargs):
        res = f(*map(to_py, *args), **map(to_py, **kwargs))
        return to_js(json.dumps(res))
    return wrapped
