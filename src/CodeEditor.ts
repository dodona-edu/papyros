/* eslint-disable valid-jsdoc */
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import { t } from "./util/Util";
import { Renderable, RenderOptions, renderWithOptions } from "./util/Rendering";
import {
    CompletionSource, autocompletion,
    closeBrackets, closeBracketsKeymap, completionKeymap
} from "@codemirror/autocomplete";
import {
    defaultKeymap, historyKeymap, indentWithTab,
    history, insertBlankLine
} from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import {
    defaultHighlightStyle, indentUnit, LanguageSupport,
    foldGutter, indentOnInput, bracketMatching, foldKeymap, syntaxHighlighting
} from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { Compartment, EditorState, Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import {
    EditorView, showPanel, lineNumbers, highlightActiveLineGutter,
    highlightSpecialChars, drawSelection,
    rectangularSelection, highlightActiveLine, keymap, placeholder, ViewUpdate
} from "@codemirror/view";
import { Diagnostic, linter, lintGutter, lintKeymap } from "@codemirror/lint";

enum Option {
    ProgrammingLanguage = "programming_language",
    Placeholder = "placeholder",
    Indentation = "indentation",
    Panel = "panel",
    Autocompletion = "autocompletion",
    Linting = "linting",
    Style = "style",
    OnChange = "change"
}
const OPTIONS = [
    Option.ProgrammingLanguage, Option.Placeholder,
    Option.Indentation, Option.Panel,
    Option.Autocompletion, Option.Linting,
    Option.Style, Option.OnChange
];

/**
 * Component that provides useful features to users writing code
 */
export class CodeEditor extends Renderable {
    /**
     * Reference to the user interface of the editor
     */
    public readonly editorView: EditorView;
    /**
     * Mapping from CodeEditorOptions to a configurable compartment
     */
    private compartments: Map<Option, Compartment>;

    /**
     * Construct a new CodeEditor
     * @param {Function} onRunRequest Callback for when the user wants to run the code
     * @param {string} initialCode The initial code to display
     * @param {number} indentLength The length in spaces for the indent unit
     */
    constructor(onRunRequest: () => void, initialCode = "", indentLength = 4) {
        super();
        this.compartments = new Map(OPTIONS.map(opt => [opt, new Compartment()]));
        const configurableExtensions = [...this.compartments.values()]
            .map(compartment => compartment.of([]));
        this.editorView = new EditorView(
            {
                state: EditorState.create({
                    doc: initialCode,
                    extensions:
                        [
                            ...configurableExtensions,
                            keymap.of([
                                {
                                    key: "Mod-Enter", run: () => {
                                        onRunRequest();
                                        return true;
                                    }
                                },
                                // The original Ctrl-Enter keybind gets assigned to Shift-Enter
                                {
                                    key: "Shift-Enter", run: insertBlankLine
                                }
                            ]),
                            ...CodeEditor.getExtensions()
                        ]
                })
            });
        this.setIndentLength(indentLength);
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
        let styleExtensions: Extension = [];
        if (options.darkMode) {
            styleExtensions = oneDark;
        } else {
            styleExtensions = syntaxHighlighting(defaultHighlightStyle, { fallback: true });
        }
        this.reconfigure([Option.Style, styleExtensions]);
        // Ensure that the classes are added to a child of the parent so that
        // dark mode classes are properly activated
        // CodeMirror dom resets its classList, so that is not an option
        const wrappingDiv = document.createElement("div");
        wrappingDiv.classList
            .add("_tw-overflow-auto", "_tw-max-h-9/10", "_tw-min-h-1/4",
                "_tw-border-solid", "_tw-border-gray-200", "_tw-border-2",
                "_tw-rounded-lg", "dark:_tw-border-dark-mode-content");
        wrappingDiv.replaceChildren(this.editorView.dom);
        renderWithOptions(options, wrappingDiv);
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
            [
                Option.Linting,
                [
                    linter(lintSource),
                    lintGutter()
                ]
            ]
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
     * @param {Function} onChange Listener that performs actions on the new contents
     */
    public onChange(onChange: ((newContent: string) => void)): void {
        this.reconfigure(
            [Option.OnChange, EditorView.updateListener.of((v: ViewUpdate) => {
                if (v.docChanged) {
                    onChange(v.state.doc.toString());
                }
            })]
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
    * Keymaps:
    *  - the default command bindings
    *  - bracket closing
    *  - searching
    *  - linting
    *  - completion
    *  - indenting with tab
    *  @return {Array<Extension} Default extensions to use
    */
    private static getExtensions(): Array<Extension> {
        return [
            lineNumbers(),
            highlightSpecialChars(),
            history(),
            foldGutter(),
            drawSelection(),
            EditorState.allowMultipleSelections.of(true),
            indentOnInput(),
            bracketMatching(),
            closeBrackets(),
            autocompletion(),
            rectangularSelection(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            highlightSelectionMatches(),
            keymap.of([
                ...closeBracketsKeymap,
                ...defaultKeymap,
                ...searchKeymap,
                ...historyKeymap,
                ...foldKeymap,
                ...completionKeymap,
                ...lintKeymap,
                indentWithTab
            ]),
        ];
    }
}
