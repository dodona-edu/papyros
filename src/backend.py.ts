export const INITIALIZATION_CODE = 
`
from pyodide import to_js
from js import console
import sys

def __override_builtins(cb):
    __capture_stdout(cb)
    __override_stdin(cb)

def __capture_stdout(cb):
    console.log("Rerouting print")
    class _OutputWriter:

        def write(self, s):
            console.log("Writing : " + s)
            cb(to_js({"type": "output", "data":s}))
            console.log("Called cb")

        def flush(self):
            pass # Given data is always immediately written

    global print
    __original_print = print
    __writer = _OutputWriter()

    def __dodona_print(*objects, sep=' ', end='\\n', file=sys.stdout, flush=False):
        console.log(f"Called my print with {objects}")
        if file == sys.stdout:
            __original_print(*objects, sep=sep, end=end, file=__writer, flush=flush)
        else:
            __original_print(*objects, sep=sep, end=end, file=file, flush=flush)

    print = __dodona_print

def __override_stdin(cb):
    global input
    def __dodona_input(prompt=""):
        console.log("Called print with prompt: " + prompt)
        print(prompt, end="")
        user_value = cb(to_js({"type": "input", "data":prompt}))
        print(user_value)
        return user_value

    input = __dodona_input
`;
/*
async def __dodona_input(console_prompt=""):
    print(console_prompt, end="")

    #from js import user_input
    #console.log("Found input: " + user_input)
    return await onInput(console_prompt)
    #if not user_input:
    #    raise _NoInputError(f"No input provided for prompt {console_prompt}.")
    #else:
    #    user_input = user_input.split("\\n")
    #    print(user_input[0]) # emulate the input being typed in the console
    #    #input_element.value = "\\n".join(user_input[1:])
    #    return user_input[0]
`;*/

     