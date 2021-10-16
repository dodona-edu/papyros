import { INPUT_TA_ID, OUTPUT_TA_ID } from "./Constants";

export const INITIALIZATION_CODE = 
`from js import document, console
import sys

__dodona_pyodide_globals = {}

class _NoInputError(Exception):
    pass

class _OutputWriter:
    def __init__(self, element_id="${OUTPUT_TA_ID}"):
        self.output = document.getElementById(element_id)

    def write(self, s):
        self.output.value += s

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

def __dodona_input(prompt=""):
    print(prompt, end="")
    input_element = document.getElementById("${INPUT_TA_ID}")
    user_input = input_element.value.split("\\n")
    console.log("Found input: " + input_element.value)

    if not user_input:
        message = f"No input found for prompt {prompt}" if prompt else ""
        raise _NoInputError(message)
    else:
        print(user_input[0])
        input_element.value = "\\n".join(user_input[1:])
        return user_input[0]


print = __dodona_print
input = __dodona_input`;
     