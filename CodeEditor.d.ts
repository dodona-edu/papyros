import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { EditorView } from "@codemirror/view";
import { CompletionSource } from "@codemirror/autocomplete";
import { Diagnostic } from "@codemirror/lint";
import { Renderable, RenderOptions } from "./util/Rendering";
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
    *  - [syntax highlighting depending on the language](#getLanguageSupport)
    *  - [line numbers](#gutter.lineNumbers)
    *  - [special character highlighting](#view.highlightSpecialChars)
    *  - [the undo history](#history.history)
    *  - [a fold gutter](#fold.foldGutter)
    *  - [gutter for linting](#lint.lintGutter)
    *  - [custom selection drawing](#view.drawSelection)
    *  - [multiple selections](#state.EditorState^allowMultipleSelections)
    *  - [reindentation on input](#language.indentOnInput)
    *  - [syntax highlighting with the default highlight style]
    *   (#highlight.defaultHighlightStyle) (as fallback)
    *  - [bracket matching](#matchbrackets.bracketMatching)
    *  - [bracket closing](#closebrackets.closeBrackets)
    *  - [autocompletion](#autocomplete.autocompletion)
    *  - [rectangular selection](#rectangular-selection.rectangularSelection)
    *  - [active line highlighting](#view.highlightActiveLine)
    *  - [active line gutter highlighting](#gutter.highlightActiveLineGutter)
    *  - [selection match highlighting](#search.highlightSelectionMatches)
    * Keymaps:
    *  - [bracket closing](#commands.closeBracketsKeymap)
    *  - [the default command bindings](#commands.defaultKeymap)
    *  - [search](#search.searchKeymap)
    *  - [commenting](#comment.commentKeymap)
    *  - [linting](#lint.lintKeymap)
    *  - [indenting with tab](#commands.indentWithTab)
    *  @return {Array<Extension} Default extensions to use
    */
    private static getExtensions;
}
