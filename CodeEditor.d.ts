import { LanguageSupport } from "@codemirror/language";
import { Compartment, Extension } from "@codemirror/state";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { EditorView } from "@codemirror/view";
import { CompletionSource } from "@codemirror/autocomplete";
import { Renderable, RenderOptions } from "./util/Rendering";
/**
 * Component that provides useful features to users writing code
 */
export declare class CodeEditor extends Renderable {
    /**
     * Reference to the user interface of the editor
     */
    editorView: EditorView;
    /**
     * Compartment to change language at runtime
     */
    languageCompartment: Compartment;
    /**
     * Compartment to configure indentation level at runtime
     */
    indentCompartment: Compartment;
    /**
     * Compartment to configure the placeholder at runtime
     */
    placeholderCompartment: Compartment;
    /**
    * Compartment to configure the panel at runtime
     */
    panelCompartment: Compartment;
    /**
     * Compartment to configure the autocompletion at runtime
     */
    autocompletionCompartment: Compartment;
    /**
     * Compartment to configure styling at runtime (e.g. switching to dark mode)
     */
    styleCompartent: Compartment;
    /**
     * Construct a new CodeEditor
     * @param {string} initialCode The initial code to display
     * @param {number} indentLength The length in spaces for the indent unit
     */
    constructor(initialCode?: string, indentLength?: number);
    protected _render(options: RenderOptions): void;
    /**
     * Set the language that is currently used
     * @param {ProgrammingLanguage} language The language to use
     */
    setLanguage(language: ProgrammingLanguage): void;
    /**
     * @param {CompletionSource} completionSource Function to obtain autocomplete results
     */
    setCompletionSource(completionSource: CompletionSource): void;
    /**
     * Set the length in spaces of the indentation unit
     * @param {number} indentLength The number of spaces to use
     */
    setIndentLength(indentLength: number): void;
    /**
     * Set the panel that is displayed at the bottom of the editor
     * @param {HTMLElement} panel The panel to display
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
     * @return {string} The indentation unit to use
     */
    static getIndentUnit(indentLength: number): string;
    /**
     * @param  {ProgrammingLanguage} language The language to support
     * @return {LanguageSupport} CodeMirror LanguageSupport for the language
     */
    static getLanguageSupport(language: ProgrammingLanguage): LanguageSupport;
    /**
    *  - [syntax highlighting depending on the language](#getLanguageSupport)
    *  - [line numbers](#gutter.lineNumbers)
    *  - [special character highlighting](#view.highlightSpecialChars)
    *  - [the undo history](#history.history)
    *  - [a fold gutter](#fold.foldGutter)
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
    static getExtensions(): Array<Extension>;
}
