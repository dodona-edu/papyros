import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { Renderable, RenderOptions } from "./util/Rendering";
import { CompletionSource } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import { Diagnostic } from "@codemirror/lint";
/**
 * Component that provides useful features to users writing code
 */
export declare class CodeEditor extends Renderable {
    /**
     * Reference to the user interface of the editor
     */
    readonly editorView: EditorView;
    /**
     * Mapping from CodeEditorOptions to a configurable compartment
     */
    private compartments;
    /**
     * Construct a new CodeEditor
     * @param {string} initialCode The initial code to display
     * @param {number} indentLength The length in spaces for the indent unit
     */
    constructor(initialCode?: string, indentLength?: number);
    /**
     * Helper method to dispatch configuration changes at runtime
     * @param {Array<[Option, Extension]>} items Array of items to reconfigure
     * The option indicates the relevant compartment
     * The extension indicates the new configuration
     */
    private reconfigure;
    /**
     * Render the editor with the given options and panel
     * @param {RenderOptions} options Options for rendering
     * @param {HTMLElement} panel The panel to display at the bottom
     * @return {HTMLElement} The rendered element
     */
    protected _render(options: RenderOptions): void;
    /**
     * @param {ProgrammingLanguage} language The language to use
     */
    setProgrammingLanguage(language: ProgrammingLanguage): void;
    /**
     * @param {CompletionSource} completionSource Function to obtain autocomplete results
     */
    setCompletionSource(completionSource: CompletionSource): void;
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
     * @return {string} The code within the editor
     */
    getCode(): string;
    /**
     * @param {string} code The new code to be shown in the editor
     */
    setCode(code: string): void;
    /**
     * Put focus on the CodeEditor
     */
    focus(): void;
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
    *  - gutter for linting
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
