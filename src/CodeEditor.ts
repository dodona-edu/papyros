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
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { commentKeymap } from "@codemirror/comment";
import { rectangularSelection } from "@codemirror/rectangular-selection";
import { defaultHighlightStyle } from "@codemirror/highlight";
import { lintKeymap } from "@codemirror/lint";
import { showPanel } from "@codemirror/panel";
import { RenderOptions, renderWithOptions } from "./util/Util";


export class CodeEditor {
    editorView: EditorView;
    languageCompartment: Compartment;
    indentCompartment: Compartment;
    placeholderCompartment: Compartment;
    panelCompartment: Compartment;

    constructor(language: ProgrammingLanguage,
        editorPlaceHolder: string, initialCode?: string, indentLength = 4) {
        this.languageCompartment = new Compartment();
        this.indentCompartment = new Compartment();
        this.placeholderCompartment = new Compartment();
        this.panelCompartment = new Compartment();
        this.editorView = new EditorView(
            {
                state: EditorState.create({
                    doc: initialCode,
                    extensions:
                        [
                            this.languageCompartment.of(CodeEditor.getLanguageSupport(language)),
                            this.indentCompartment.of(
                                indentUnit.of(CodeEditor.getIndentUnit(indentLength))
                            ),
                            keymap.of([indentWithTab]),
                            this.placeholderCompartment.of(placeholder(editorPlaceHolder)),
                            this.panelCompartment.of(showPanel.of(null)),
                            ...CodeEditor.getExtensions()
                        ]
                })
            });
    }

    render(options: RenderOptions, panel?: HTMLElement): HTMLElement {
        if (panel) {
            this.setPanel(panel);
        }
        options.classNames =
            // eslint-disable-next-line max-len
            `overflow-auto max-h-9/10 min-h-1/4 border-solid border-gray-200 border-2 ${options.classNames}`;
        return renderWithOptions(options, this.editorView.dom);
    }

    setLanguage(language: ProgrammingLanguage, editorPlaceHolder: string): void {
        this.editorView.dispatch({
            effects: [
                this.languageCompartment.reconfigure(CodeEditor.getLanguageSupport(language)),
                this.placeholderCompartment.reconfigure(placeholder(editorPlaceHolder))
            ]
        });
    }

    setIndentLength(indentLength: number): void {
        this.editorView.dispatch({
            effects: this.indentCompartment.reconfigure(
                indentUnit.of(CodeEditor.getIndentUnit(indentLength))
            )
        });
    }

    setPanel(panel: HTMLElement): void {
        this.editorView.dispatch({
            effects: [this.panelCompartment.reconfigure(showPanel.of(() => {
                return { dom: panel };
            }))]
        });
    }

    getCode(): string {
        return this.editorView.state.doc.toString();
    }

    setCode(code: string): void {
        this.editorView.dispatch(
            { changes: { from: 0, to: this.getCode().length, insert: code } }
        );
    }

    focus(): void {
        this.editorView.focus();
    }

    static getIndentUnit(indentLength: number): string {
        return new Array(indentLength).fill(" ").join("");
    }

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

    /*
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
