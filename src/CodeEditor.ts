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

function getEditorView(parentElement: HTMLElement,
    language: ProgrammingLanguage, initialCode?: string): EditorView {
    return new EditorView({
        state: EditorState.create({
            doc: initialCode || "",
            extensions: [
                basicSetup,
                keymap.of([indentWithTab]),
                getLanguageSupport(language)
            ]
        }),
        parent: parentElement
    });
}

export class CodeEditor {
    element: HTMLElement;
    editorView: EditorView | undefined;
    minLines: number;

    constructor(element: HTMLElement, language: ProgrammingLanguage,
        initialCode?: string, minLines = 10) {
        this.element = element;
        this.minLines = minLines;
        this.setLanguage(language, initialCode);
    }

    setLanguage(language: ProgrammingLanguage, code?: string): void {
        const initialCode = code || new Array(this.minLines).fill("").join("\n");
        this.editorView = getEditorView(this.element, language, initialCode);
        this.element.replaceChildren(this.editorView.dom);
    }

    getCode(): string {
        if (this.editorView) {
            return this.editorView.state.sliceDoc();
        } else {
            return "";
        }
    }
}
