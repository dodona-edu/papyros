from jedi import Script
from .util import to_py
from pyodide_worker_runner import install_imports

def convert_completion(completion, index):
    converted = dict(type=completion.type, label=completion.name_with_symbols)
    if completion.type != "keyword":
        # Keywords have obvious meanings yet non-useful docstrings
        converted["info"] = completion.docstring().replace("\n", "\r\n")
    # Jedi does sorting, so give earlier element highest boost
    converted["boost"] = -index
    return converted

async def autocomplete(context):
    context = to_py(context)
    await install_imports(context["text"])
    if context["before"]:
        before = context["before"]
    else:
        before = dict(text=None)
        before["from"] = context["pos"]

    complete_from = before["from"]
    if not context["explicit"] and \
         (context["before"] is not None and not context["before"]["text"]):
        # If user did not request completions, don't complete for the empty string
        options = []
    else:
        s = Script(context["text"])
        # Convert Jedi completions to CodeMirror objects
        options = [convert_completion(c, i)
                   for (i, c) in enumerate(s.complete(line=context["line"], column=context["column"]))]
        if "." in before["text"]:
            complete_from = before["to"]
    results = dict(options=options)
    results["from"] = complete_from
    return results
