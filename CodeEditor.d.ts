import { LanguageSupport } from "@codemirror/language";
import { Compartment, Extension } from "@codemirror/state";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { EditorView } from "@codemirror/view";
import { CompletionSource } from "@codemirror/autocomplete";
import { RenderOptions } from "./util/Util";
/**
 * Component that provides useful features to users writing code
 */
export declare class CodeEditor {
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
     * Indices of lines in the editor that have breakpoints
     */
    readonly breakpointLines: Set<number>;
    /**
     * Construct a new CodeEditor
     * @param {string} initialCode The initial code to display
     * @param {number} indentLength The length in spaces for the indent unit
     */
    constructor(initialCode?: string, indentLength?: number);
    /**
     * Update the breakpoint status of the given line
     * @param {number} lineNr The index of the line
     * @param {boolean} active Whether the line has a breakpoint
     */
    toggleBreakpoint(lineNr: number, active: boolean): void;
    /**
     * Highlight the given line
     * @param {number} lineNr The 1-based number of the line to highlight
     */
    highlight(lineNr: number): void;
    /**
     * Render the editor with the given options and panel
     * @param {RenderOptions} options Options for rendering
     * @param {HTMLElement} panel The panel to display at the bottom
     * @return {HTMLElement} The rendered element
     */
    render(options: RenderOptions, panel?: HTMLElement): HTMLElement;
    /**
     * Set the language that is currently used, with a corresponding placeholder
     * @param {ProgrammingLanguage} language The language to use
     * @param {CompletionSource} completionSource Function to generate autocomplete results
     * @param {string} editorPlaceHolder Placeholder when empty
     */
    setLanguage(language: ProgrammingLanguage, completionSource: CompletionSource): void;
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
    *  - [the default highlight style](#highlight.defaultHighlightStyle) (as fallback)
    *  - [bracket matching](#matchbrackets.bracketMatching)
    *  - [bracket closing](#closebrackets.closeBrackets)
    *  - [autocompletion](#autocomplete.autocompletion)
    *  - [rectangular selection](#rectangular-selection.rectangularSelection)
    *  - [active line highlighting](#view.highlightActiveLine)
    *  - [active line gutter highlighting](#gutter.highlightActiveLineGutter)
    *  - [selection match highlighting](#search.highlightSelectionMatches)
    * Keymaps:
    *  - [the default command bindings](#commands.defaultKeymap)
    *  - [search](#search.searchKeymap)
    *  - [commenting](#comment.commentKeymap)
    *  - [linting](#lint.lintKeymap)
    *  - [indenting with tab](#commands.indentWithTab)
    *  @return {Array<Extension} Default extensions to use
    */
    static getDefaultExtensions(): Array<Extension>;
}
