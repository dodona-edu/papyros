def to_py(arg):
    if hasattr(arg, "to_py"):
        arg = arg.to_py()
    elif isinstance(arg, list):
        for i, el in enumerate(arg):
            arg[i] = to_py(el)
    return arg
