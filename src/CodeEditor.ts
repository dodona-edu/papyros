import { EditorState, basicSetup } from "@codemirror/basic-setup";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { python } from "@codemirror/lang-python";
import { indentUnit, LanguageSupport } from "@codemirror/language";
import { Compartment, Extension } from "@codemirror/state";

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
    initialCode = "", extensions?: Extension[]): EditorView {
    return new EditorView({
        state: EditorState.create({
            doc: initialCode,
            extensions: [
                extensions || [],
                basicSetup,
                keymap.of([indentWithTab])
            ]
        }),
        parent: parentElement
    });
}

function getIndentUnit(indentLength: number): string {
    return new Array(indentLength).fill(" ").join("");
}

export class CodeEditor {
    editorView: EditorView;
    languageCompartment: Compartment;
    indentCompartment: Compartment;

    constructor(element: HTMLElement, language: ProgrammingLanguage,
        initialCode?: string, indentLength = 4) {
        this.languageCompartment = new Compartment();
        this.indentCompartment = new Compartment();
        this.editorView = getEditorView(element, initialCode,
            [
                this.languageCompartment.of(getLanguageSupport(language)),
                this.indentCompartment.of(indentUnit.of(getIndentUnit(indentLength)))
            ]);
        element.replaceChildren(this.editorView.dom);
    }

    setLanguage(language: ProgrammingLanguage): void {
        this.editorView.dispatch({
            effects: this.languageCompartment.reconfigure(getLanguageSupport(language))
        });
    }

    setIndentLength(indentLength: number): void {
        this.editorView.dispatch({
            effects: this.indentCompartment.reconfigure(indentUnit.of(getIndentUnit(indentLength)))
        });
    }

    getCode(): string {
        return this.editorView.state.doc.toString();
    }
}
