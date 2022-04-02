def to_py(arg):
    if arg.to_py:
        arg = arg.to_py()
    return arg
