def to_py(arg):
    if hasattr(arg, "to_py"):
        arg = arg.to_py()
    return arg
