/* eslint-disable valid-jsdoc */
import { ProgrammingLanguage } from "../ProgrammingLanguage";
import { t } from "../util/Util";
import {
    CompletionSource, autocompletion,
    closeBrackets, closeBracketsKeymap, completionKeymap, startCompletion
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
import { EditorState, Extension } from "@codemirror/state";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import {
    EditorView, showPanel, lineNumbers, highlightActiveLineGutter,
    highlightSpecialChars, drawSelection,
    rectangularSelection, highlightActiveLine, keymap, ViewUpdate
} from "@codemirror/view";
import { Diagnostic, linter, lintGutter, lintKeymap } from "@codemirror/lint";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { darkTheme } from "./DarkTheme";
import { ArrowGutter, ArrowGutterInfo } from "./Gutters";
import { BackendManager } from "../BackendManager";
import { BackendEventType } from "../BackendEvent";

interface VisualizeArrowArgs {
    visualizing: boolean,
    getInfo: (lineInfo: number) => ArrowGutterInfo
}

/**
 * Component that provides useful features to users writing code
 */
export class CodeEditor extends CodeMirrorEditor {
    public static PROGRAMMING_LANGUAGE = "programming_language";
    public static INDENTATION = "indentation";
    public static PANEL = "panel";
    public static AUTOCOMPLETION = "autocompletion";
    public static LINTING = "linting";

    private arrowGutter: ArrowGutter;
    private visualizeArrowArgs?: VisualizeArrowArgs;

    /**
     * Construct a new CodeEditor
     * @param {Function} onRunRequest Callback for when the user wants to run the code
     * @param {string} initialCode The initial code to display
     * @param {number} indentLength The length in spaces for the indent unit
     */
    constructor(onRunRequest: () => void, initialCode = "", indentLength = 4) {
        super(new Set([
            CodeEditor.PROGRAMMING_LANGUAGE, CodeEditor.INDENTATION,
            CodeEditor.PANEL, CodeEditor.AUTOCOMPLETION, CodeEditor.LINTING
        ]), {
            classes: ["papyros-code-editor", "_tw-overflow-auto",
                "_tw-border-solid", "_tw-border-gray-200", "_tw-border-2",
                "_tw-rounded-lg", "dark:_tw-border-dark-mode-content"],
            minHeight: "20vh",
            maxHeight: "72vh",
            theme: {}
        });
        this.arrowGutter = new ArrowGutter();
        this.addExtension([
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
            this.arrowGutter.toExtension(),
            ...CodeEditor.getExtensions()
        ]);
        this.setText(initialCode);
        this.setIndentLength(indentLength);
        BackendManager.subscribe(BackendEventType.VisualizeStep, e => {
            const curLine = e.data.cur.line;
            const prevLine = e.data.executed === undefined ? -1 : e.data.executed.line;
            this.setArrowStep({ visualizing: true, getInfo: (lineInfo: number) => {
                const on = (curLine === lineInfo || prevLine === lineInfo);
                const cur = curLine === lineInfo;
                return {
                    cur: e.data.cur.event === "return" ? false : cur,
                    on: on,
                    lineNr: lineInfo };
            } });
        });
        BackendManager.subscribe(BackendEventType.End, () => {
            this.visualizeArrowArgs = undefined;
            this.render();
        });
    }


    private getLastVisualizeArrows(): VisualizeArrowArgs {
        return this.visualizeArrowArgs || {
            visualizing: false,
            getInfo: lineNr => {
                return {
                    lineNr,
                    on: false,
                    cur: false
                };
            }
        };
    }

    protected override onViewUpdate(v: ViewUpdate): void {
        super.onViewUpdate(v);
        // Ensure that highlighting occurs after CodeMirrors internal update
        // so that the style classes are not overwritten
        setTimeout(() => {
            this.setArrowStep(this.getLastVisualizeArrows());
        }, 10);
    }


    public setArrowStep(args: VisualizeArrowArgs): void {
        const {
            visualizing, getInfo
        } = args;
        this.visualizeArrowArgs = args;
        this.editorView.dom.querySelectorAll(".cm-line").forEach((line, i) => {
            const info = getInfo(i + 1);
            this.arrowGutter.setMarker(this.editorView, info);
        });
    }

    public override setDarkMode(darkMode: boolean): void {
        let styleExtensions: Extension = [];
        if (darkMode) {
            styleExtensions = [darkTheme, syntaxHighlighting(oneDarkHighlightStyle)];
        } else {
            styleExtensions = syntaxHighlighting(defaultHighlightStyle);
        }
        this.reconfigure([CodeMirrorEditor.STYLE, styleExtensions]);
    }

    /**
     * @param {ProgrammingLanguage} language The language to use
     */
    public setProgrammingLanguage(language: ProgrammingLanguage)
        : void {
        this.reconfigure(
            [CodeEditor.PROGRAMMING_LANGUAGE, CodeEditor.getLanguageSupport(language)]
        );
        this.setPlaceholder(t("Papyros.code_placeholder",
            { programmingLanguage: language }));
    }

    /**
     * @param {CompletionSource} completionSource Function to obtain autocomplete results
     */
    public setCompletionSource(completionSource: CompletionSource): void {
        this.reconfigure(
            [CodeEditor.AUTOCOMPLETION, autocompletion({ override: [completionSource] })]
        );
        startCompletion(this.editorView);
    }

    /**
     * @param {LintSource} lintSource Function to obtain linting results
     */
    public setLintingSource(
        lintSource: (view: EditorView) => readonly Diagnostic[] | Promise<readonly Diagnostic[]>)
        : void {
        this.reconfigure(
            [
                CodeEditor.LINTING,
                linter(lintSource)
            ]
        );
    }

    /**
     * @param {number} indentLength The number of spaces to use for indentation
     */
    public setIndentLength(indentLength: number): void {
        this.reconfigure(
            [CodeEditor.INDENTATION, indentUnit.of(CodeEditor.getIndentUnit(indentLength))]
        );
    }

    /**
     * @param {HTMLElement} panel The panel to display at the bottom of the editor
     */
    public setPanel(panel: HTMLElement): void {
        this.reconfigure(
            [CodeEditor.PANEL, showPanel.of(() => {
                return { dom: panel };
            })]
        );
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
    private static getExtensions(): Array<Extension> {
        return [
            lintGutter(),
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
