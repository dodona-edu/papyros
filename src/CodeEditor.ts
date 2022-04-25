/* eslint-disable valid-jsdoc */
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { Compartment, EditorState, Extension } from "@codemirror/state";
import { indentUnit, LanguageSupport } from "@codemirror/language";
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
import { lintKeymap, linter, Diagnostic, lintGutter } from "@codemirror/lint";
import { t } from "./util/Util";
import { oneDark } from "@codemirror/theme-one-dark";
import { defaultHighlightStyle } from "@codemirror/highlight";
import { showPanel } from "@codemirror/panel";
import { Renderable, RenderOptions, appendClasses, renderWithOptions } from "./util/Rendering";

enum Option {
    ProgrammingLanguage = "programming_language",
    Placeholder = "placeholder",
    Indentation = "indentation",
    Panel = "panel",
    Autocompletion = "autocompletion",
    Linting = "linting",
    Style = "style"
}
const OPTIONS = [
    Option.ProgrammingLanguage, Option.Placeholder,
    Option.Indentation, Option.Panel,
    Option.Autocompletion, Option.Linting,
    Option.Style
];

/**
 * Component that provides useful features to users writing code
 */
export class CodeEditor extends Renderable {
    /**
     * Reference to the user interface of the editor
     */
    private editorView: EditorView;
    /**
     * Mapping from CodeEditorOptions to a configurable compartment
     */
    private compartments: Map<Option, Compartment>;

    /**
     * Construct a new CodeEditor
     * @param {string} initialCode The initial code to display
     * @param {number} indentLength The length in spaces for the indent unit
     */
    constructor(initialCode = "", indentLength = 4) {
        super();
        this.compartments = new Map(OPTIONS.map(opt => [opt, new Compartment()]));
        this.setIndentLength(indentLength);
        const configurableExtensions = [...this.compartments.values()]
            .map(compartment => compartment.of([]));
        this.editorView = new EditorView(
            {
                state: EditorState.create({
                    doc: initialCode,
                    extensions:
                        [
                            ...configurableExtensions,
                            ...CodeEditor.getExtensions()
                        ]
                })
            });
    }

    /**
     * Helper method to dispatch configuration changes at runtime
     * @param {Array<[Option, Extension]>} items Array of items to reconfigure
     * The option indicates the relevant compartment
     * The extension indicates the new configuration
     */
    private reconfigure(...items: Array<[Option, Extension]>): void {
        this.editorView.dispatch({
            effects: items.map(([opt, ext]) => this.compartments.get(opt)!.reconfigure(ext))
        });
    }

    /**
     * Render the editor with the given options and panel
     * @param {RenderOptions} options Options for rendering
     * @param {HTMLElement} panel The panel to display at the bottom
     * @return {HTMLElement} The rendered element
     */
    protected override _render(options: RenderOptions): void {
        appendClasses(options,
            // eslint-disable-next-line max-len
            "_tw-overflow-auto _tw-max-h-9/10 _tw-min-h-1/4 _tw-border-solid _tw-border-gray-200 _tw-border-2 _tw-rounded-lg dark:_tw-border-0");
        let styleExtensions: Extension = [];
        if (options.darkMode) {
            styleExtensions = oneDark;
        } else {
            styleExtensions = defaultHighlightStyle.fallback;
            // styleExtensions = syntaxHighlighting(defaultHighlightStyle, { fallback: true });
        }
        this.reconfigure([Option.Style, styleExtensions]);
        renderWithOptions(options, this.editorView.dom);
    }

    /**
     * @param {ProgrammingLanguage} language The language to use
     */
    public setProgrammingLanguage(language: ProgrammingLanguage)
        : void {
        this.reconfigure(
            [Option.ProgrammingLanguage, CodeEditor.getLanguageSupport(language)],
            [Option.Placeholder, placeholder(t("Papyros.code_placeholder",
                { programmingLanguage: language }))]
        );
    }

    /**
     * @param {CompletionSource} completionSource Function to obtain autocomplete results
     */
    public setCompletionSource(completionSource: CompletionSource): void {
        this.reconfigure(
            [Option.Autocompletion, autocompletion({ override: [completionSource] })]
        );
    }

    /**
     * @param {LintSource} lintSource Function to obtain linting results
     */
    public setLintingSource(
        lintSource: (view: EditorView) => readonly Diagnostic[] | Promise<readonly Diagnostic[]>)
        : void {
        this.reconfigure(
            [Option.Linting, linter(lintSource)]
        );
    }

    /**
     * @param {number} indentLength The number of spaces to use for indentation
     */
    public setIndentLength(indentLength: number): void {
        this.reconfigure(
            [Option.Indentation, indentUnit.of(CodeEditor.getIndentUnit(indentLength))]
        );
    }

    /**
     * @param {HTMLElement} panel The panel to display at the bottom of the editor
     */
    public setPanel(panel: HTMLElement): void {
        this.reconfigure(
            [Option.Panel, showPanel.of(() => {
                return { dom: panel };
            })]
        );
    }

    /**
     * @return {string} The code within the editor
     */
    public getCode(): string {
        return this.editorView.state.doc.toString();
    }

    /**
     * @param {string} code The new code to be shown in the editor
     */
    public setCode(code: string): void {
        this.editorView.dispatch(
            { changes: { from: 0, to: this.getCode().length, insert: code } }
        );
    }

    /**
     * Put focus on the CodeEditor
     */
    public focus(): void {
        this.editorView.focus();
    }

    /**
     * @param {number} indentLength The amount of spaces to use
     * @return {string} The indentation unit to be used by CodeMirror
     */
    private static getIndentUnit(indentLength: number): string {
        return new Array(indentLength).fill(" ").join("");
    }

    /**
     * @param  {ProgrammingLanguage} language The language to support
     * @return {LanguageSupport} CodeMirror LanguageSupport for the language
     */
    private static getLanguageSupport(language: ProgrammingLanguage): LanguageSupport {
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
    private static getExtensions(): Array<Extension> {
        return [
            lineNumbers(),
            highlightActiveLineGutter(),
            highlightSpecialChars(),
            history(),
            foldGutter(),
            lintGutter(),
            drawSelection(),
            EditorState.allowMultipleSelections.of(true),
            indentOnInput(),
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
