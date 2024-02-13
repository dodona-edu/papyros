import { ProgrammingLanguage } from "../ProgrammingLanguage";
import { EditorView } from "@codemirror/view";
import { Diagnostic } from "@codemirror/lint";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
/**
 * Component that provides useful features to users writing code
 */
export declare class CodeEditor extends CodeMirrorEditor {
    static PROGRAMMING_LANGUAGE: string;
    static INDENTATION: string;
    static PANEL: string;
    static AUTOCOMPLETION: string;
    static LINTING: string;
    private debugLineGutter;
    private testCodeExtension;
    /**
     * Construct a new CodeEditor
     * @param {Function} onRunRequest Callback for when the user wants to run the code
     * @param {string} initialCode The initial code to display
     * @param {number} indentLength The length in spaces for the indent unit
     */
    constructor(onRunRequest: () => void, initialCode?: string, indentLength?: number);
    set testCode(code: string);
    getText(): string;
    getCode(): string;
    setDarkMode(darkMode: boolean): void;
    /**
     * @param {ProgrammingLanguage} language The language to use
     */
    setProgrammingLanguage(language: ProgrammingLanguage): void;
    /**
     * @param {LintSource} lintSource Function to obtain linting results
     */
    setLintingSource(lintSource: (view: EditorView) => readonly Diagnostic[] | Promise<readonly Diagnostic[]>): void;
    /**
     * @param {number} indentLength The number of spaces to use for indentation
     */
    setIndentLength(indentLength: number): void;
    /**
     * @param {HTMLElement} panel The panel to display at the bottom of the editor
     */
    setPanel(panel: HTMLElement): void;
    /**
     * @param {number} indentLength The amount of spaces to use
     * @return {string} The indentation unit to be used by CodeMirror
     */
    private static getIndentUnit;
    /**
     * @param  {ProgrammingLanguage} language The language to support
     * @return {LanguageSupport} CodeMirror LanguageSupport for the language
     */
    private static getLanguageSupport;
    /**
    *  - line numbers
    *  - special character highlighting
    *  - the undo history
    *  - a fold gutter
    *  - custom selection drawing
    *  - multiple selections
    *  - reindentation on input
    *  - bracket matching
    *  - bracket closing
    *  - autocompletion
    *  - rectangular selection
    *  - active line highlighting
    *  - active line gutter highlighting
    *  - selection match highlighting
    *  - gutter for linting
    * Keymaps:
    *  - the default command bindings
    *  - bracket closing
    *  - searching
    *  - linting
    *  - completion
    *  - indenting with tab
    *  @return {Array<Extension} Default extensions to use
    */
    private static getExtensions;
}
