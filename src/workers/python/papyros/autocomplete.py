from jedi import Script

def convert_completion(completion, index):
    converted = dict(type=completion.type, label=completion.name_with_symbols)
    if completion.type != "keyword": # Keywords have obvious meanings yet non-useful docstrings
        converted["info"] = completion.docstring()
    # Jedi does sorting, so give earlier element highest boost
    converted["boost"] = -index
    return converted

async def autocomplete(context):
    # Ensure before-match is not None
    before = context.get("before", {"text": "", "from": context["pos"]})
    complete_from = before["from"]
    if context["explicit"] or before["text"]:
        completions = Script(context["text"]).complete(line=context["line"], column=context["column"])
        # Convert Jedi completions to CodeMirror objects
        options = [convert_completion(c, i)
                   for (i, c) in enumerate(completions)]
        if "." in before["text"]:
            # Completing a property access, so complete from end of match
            complete_from = before["to"]
    else:
        # Don't complete for emptry string unless asked for
        options = []
    return {
        "options": options,
        "from": complete_from
    }
