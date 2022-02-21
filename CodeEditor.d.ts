import { LanguageSupport } from "@codemirror/language";
import { Compartment, Extension } from "@codemirror/state";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { EditorView } from "@codemirror/view";
import { RenderOptions } from "./util/Util";
export declare class CodeEditor {
    editorView: EditorView;
    languageCompartment: Compartment;
    indentCompartment: Compartment;
    placeholderCompartment: Compartment;
    panelCompartment: Compartment;
    constructor(language: ProgrammingLanguage, editorPlaceHolder: string, initialCode?: string, indentLength?: number);
    render(options: RenderOptions, panel?: HTMLElement): HTMLElement;
    setLanguage(language: ProgrammingLanguage, editorPlaceHolder: string): void;
    setIndentLength(indentLength: number): void;
    setPanel(panel: HTMLElement): void;
    getCode(): string;
    setCode(code: string): void;
    focus(): void;
    static getIndentUnit(indentLength: number): string;
    static getLanguageSupport(language: ProgrammingLanguage): LanguageSupport;
    static getExtensions(): Array<Extension>;
}
