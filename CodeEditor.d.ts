import { Compartment } from "@codemirror/state";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { EditorView } from "@codemirror/view";
export declare class CodeEditor {
    editorView: EditorView;
    languageCompartment: Compartment;
    indentCompartment: Compartment;
    placeholderCompartment: Compartment;
    constructor(element: HTMLElement, language: ProgrammingLanguage, panel: HTMLElement, editorPlaceHolder: string, initialCode?: string, indentLength?: number);
    setLanguage(language: ProgrammingLanguage, editorPlaceHolder: string): void;
    setIndentLength(indentLength: number): void;
    getCode(): string;
    focus(): void;
}
