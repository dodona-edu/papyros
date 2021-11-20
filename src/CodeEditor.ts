import { EditorState, basicSetup } from "@codemirror/basic-setup";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { python } from "@codemirror/lang-python";
import { LanguageSupport } from "@codemirror/language";

function getLanguageSupport(language: ProgrammingLanguage): LanguageSupport {
    switch (language) {
        case ProgrammingLanguage.Python: {
            return python();
        }
        case ProgrammingLanguage.JavaScript: {
            return javascript();
        }
        default: {
            throw new Error(`${language} is not yet supported.`);
        }
    }
}

export function initEditor(elemId: string, language: ProgrammingLanguage, initialCode?: string)
    : EditorView {
    return new EditorView({
        state: EditorState.create({
            doc: initialCode || "",
            extensions: [
                basicSetup,
                keymap.of([indentWithTab]),
                getLanguageSupport(language)
            ]
        }),
        parent: document.getElementById(elemId) as HTMLElement
    });
}
