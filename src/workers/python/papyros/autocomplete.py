import jedi
import json
from pyodide import to_js

def convert_completion(completion, index):
    converted = dict(type=completion.type, label=completion.name_with_symbols)
    # if completion.get_signatures():
    #     converted["detail"] = completion.get_signatures()[0].description
    # converted["detail"] = f"{completion.parent().name} ({completion.type})" 
    if completion.type != "keyword":
        # Keywords have obvious meanings yet non-useful docstrings
        converted["info"] = completion.docstring().replace("\n", "\r\n")
    # Jedi does sorting, so give earlier element highest boost
    converted["boost"] = -index
    return converted

async def autocomplete(context):
    context = context.to_py()
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
        import jedi
        s = jedi.Script(context["text"])
        # Convert Jedi completions to CodeMirror objects
        options = [convert_completion(c, i)
                   for (i, c) in enumerate(s.complete(line=context["line"], column=context["column"]))]
        if "." in before["text"]:
            complete_from = before["to"]
    results = dict(options=json.dumps(options), contentType="text/json")
    results["from"] = complete_from
    return to_js(results)
