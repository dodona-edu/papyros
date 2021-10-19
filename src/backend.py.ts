export const INITIALIZATION_CODE = 
`
from pyodide import to_js
from js import console, onPrint, onInput
import sys

__dodona_pyodide_globals = {}

class _NoInputError(Exception):
    pass

class _OutputWriter:

    def write(self, s):
        onPrint(s)

    def flush(self):
        pass # Given data is always immediately written

__dodona_pyodide_globals["input"] = input
__dodona_pyodide_globals["print"] = print
__dodona_pyodide_globals["file"] = _OutputWriter() 

def __dodona_print(*objects, sep=' ', end='\\n', file=sys.stdout, flush=False):
    console.log(f"Called my print with {objects}")
    if file == sys.stdout:
        __dodona_pyodide_globals["print"](*objects, sep=sep, end=end, file=__dodona_pyodide_globals["file"], flush=flush)
    else:
        __dodona_pyodide_globals["print"](*objects, sep=sep, end=end, file=file, flush=flush)

def __dodona_input(console_prompt=""):
    print(console_prompt, end="")
    from js import user_input
    console.log("Found input: " + user_input)
    onInput(console_prompt)
    if not user_input:
        raise _NoInputError(f"No input provided for prompt {console_prompt}.")
    else:
        user_input = user_input.split("\\n")
        print(user_input[0]) # emulate the input being typed in the console
        #input_element.value = "\\n".join(user_input[1:])
        return user_input[0]


print = __dodona_print
input = __dodona_input`;
     