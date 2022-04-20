/* eslint-disable valid-jsdoc */
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { indentUnit, LanguageSupport } from "@codemirror/language";
import { Compartment, EditorState, Extension } from "@codemirror/state";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { python } from "@codemirror/lang-python";
import {
    EditorView,
    keymap, highlightSpecialChars,
    drawSelection, highlightActiveLine,
    placeholder
}
    from "@codemirror/view";
import { history, historyKeymap } from "@codemirror/history";
import { foldGutter, foldKeymap } from "@codemirror/fold";
import { indentOnInput } from "@codemirror/language";
import { lineNumbers, highlightActiveLineGutter } from "@codemirror/gutter";
import { defaultKeymap } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/matchbrackets";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/closebrackets";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { autocompletion, completionKeymap, CompletionSource } from "@codemirror/autocomplete";
import { commentKeymap } from "@codemirror/comment";
import { rectangularSelection } from "@codemirror/rectangular-selection";
import { defaultHighlightStyle } from "@codemirror/highlight";
import { lintKeymap, linter, Diagnostic, lintGutter } from "@codemirror/lint";
import { showPanel } from "@codemirror/panel";
import { t } from "./util/Util";
import { appendClasses, Renderable, RenderOptions, renderWithOptions } from "./util/Rendering";

/**
 * Component that provides useful features to users writing code
 */
export class CodeEditor extends Renderable {
    /**
     * Reference to the user interface of the editor
     */
    editorView: EditorView;
    /**
     * Compartment to change language at runtime
     */
    languageCompartment: Compartment = new Compartment();
    /**
     * Compartment to configure indentation level at runtime
     */
    indentCompartment: Compartment = new Compartment();
    /**
     * Compartment to configure the placeholder at runtime
     */
    placeholderCompartment: Compartment = new Compartment();
    /**
    * Compartment to configure the panel at runtime
     */
    panelCompartment: Compartment = new Compartment();
    /**
     * Compartment to configure the autocompletion at runtime
     */
    autocompletionCompartment: Compartment = new Compartment();
    /**
     * Compartment to configure linting at runtime
     */
    lintCompartment: Compartment = new Compartment();
    /**
     * Construct a new CodeEditor
     * @param {ProgrammingLanguage} language The used programming language
     * @param {string} editorPlaceHolder The placeholder for the editor
     * @param {string} initialCode The initial code to display
     * @param {number} indentLength The length in spaces for the indent unit
     */
    constructor(initialCode = "", indentLength = 4) {
        super();
        this.editorView = new EditorView(
            {
                state: EditorState.create({
                    doc: initialCode,
                    extensions:
                        [
                            this.languageCompartment.of([]),
                            this.autocompletionCompartment.of(
                                autocompletion()
                            ),
                            this.lintCompartment.of([]),
                            lintGutter(),
                            this.indentCompartment.of(
                                indentUnit.of(CodeEditor.getIndentUnit(indentLength))
                            ),
                            keymap.of([indentWithTab]),
                            this.placeholderCompartment.of([]),
                            this.panelCompartment.of(showPanel.of(null)),
                            ...CodeEditor.getExtensions()
                        ]
                })
            });
    }

    protected override _render(options: RenderOptions): void {
        appendClasses(options,
            "overflow-auto max-h-9/10 min-h-1/4 border-solid border-gray-200 border-2");
        renderWithOptions(options, this.editorView.dom);
    }

    /**
     * Set the language that is currently used
     * @param {ProgrammingLanguage} language The language to use
     */
    setLanguage(language: ProgrammingLanguage)
        : void {
        this.editorView.dispatch({
            effects: [
                this.languageCompartment.reconfigure(CodeEditor.getLanguageSupport(language)),
                this.placeholderCompartment.reconfigure(placeholder(t("Papyros.code_placeholder",
                    { programmingLanguage: language })))
            ]
        });
    }

    /**
     * @param {CompletionSource} completionSource Function to obtain autocomplete results
     */
    setCompletionSource(completionSource: CompletionSource): void {
        this.editorView.dispatch({
            effects: [
                this.autocompletionCompartment.reconfigure(
                    autocompletion({ override: [completionSource] })
                )
            ]
        });
    }

    setLintingSource(
        lintSource: (view: EditorView) => readonly Diagnostic[] | Promise<readonly Diagnostic[]>)
        : void {
        this.editorView.dispatch({
            effects: [
                this.lintCompartment.reconfigure(
                    linter(lintSource)
                )
            ]
        });
    }

    /**
     * Set the length in spaces of the indentation unit
     * @param {number} indentLength The number of spaces to use
     */
    setIndentLength(indentLength: number): void {
        this.editorView.dispatch({
            effects: this.indentCompartment.reconfigure(
                indentUnit.of(CodeEditor.getIndentUnit(indentLength))
            )
        });
    }

    /**
     * Set the panel that is displayed at the bottom of the editor
     * @param {HTMLElement} panel The panel to display
     */
    setPanel(panel: HTMLElement): void {
        this.editorView.dispatch({
            effects: this.panelCompartment.reconfigure(showPanel.of(() => {
                return { dom: panel };
            }))
        });
    }

    /**
     * @return {string} The code within the editor
     */
    getCode(): string {
        return this.editorView.state.doc.toString();
    }

    /**
     * @param {string} code The new code to be shown in the editor
     */
    setCode(code: string): void {
        this.editorView.dispatch(
            { changes: { from: 0, to: this.getCode().length, insert: code } }
        );
    }

    /**
     * Put focus on the CodeEditor
     */
    focus(): void {
        this.editorView.focus();
    }

    /**
     * @param {number} indentLength The amount of spaces to use
     * @return {string} The indentation unit to use
     */
    static getIndentUnit(indentLength: number): string {
        return new Array(indentLength).fill(" ").join("");
    }

    /**
     * @param  {ProgrammingLanguage} language The language to support
     * @return {LanguageSupport} CodeMirror LanguageSupport for the language
     */
    static getLanguageSupport(language: ProgrammingLanguage): LanguageSupport {
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
    static getExtensions(): Array<Extension> {
        return [
            lineNumbers(),
            highlightActiveLineGutter(),
            highlightSpecialChars(),
            history(),
            foldGutter(),
            drawSelection(),
            EditorState.allowMultipleSelections.of(true),
            indentOnInput(),
            defaultHighlightStyle.fallback,
            bracketMatching(),
            closeBrackets(),
            autocompletion(),
            rectangularSelection(),
            highlightActiveLine(),
            highlightSelectionMatches(),
            keymap.of([
                ...closeBracketsKeymap,
                ...defaultKeymap,
                ...searchKeymap,
                ...historyKeymap,
                ...foldKeymap,
                ...commentKeymap,
                ...completionKeymap,
                ...lintKeymap,
                indentWithTab
            ]),
        ];
    }
}
