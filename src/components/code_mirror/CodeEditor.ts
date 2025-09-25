import {customElement, property} from "lit/decorators.js";
import {CodeMirrorEditor} from "./CodeMirrorEditor";
import {
    drawSelection, EditorView, highlightActiveLine,
    highlightActiveLineGutter,
    highlightSpecialChars,
    keymap,
    lineNumbers,
    rectangularSelection
} from "@codemirror/view";
import {defaultKeymap, history, historyKeymap, indentWithTab} from "@codemirror/commands";
import {
    bracketMatching, defaultHighlightStyle,
    foldGutter,
    indentOnInput, indentUnit,
    LanguageSupport,
    syntaxHighlighting
} from "@codemirror/language";
import {EditorState} from "@codemirror/state";
import {
    acceptCompletion,
    autocompletion,
    closeBrackets,
    closeBracketsKeymap,
    completionKeymap
} from "@codemirror/autocomplete";
import {highlightSelectionMatches, searchKeymap} from "@codemirror/search";
import {Diagnostic, linter, lintGutter, lintKeymap} from "@codemirror/lint";
import {debugExtension, markDebugLine} from "./DebugExtension";
import {TestCodeExtension} from "./TestCodeExtension";
import {css} from "lit";
import {javascript} from "@codemirror/lang-javascript";
import {python} from "@codemirror/lang-python";
import {WorkerDiagnostic} from "../../Backend";
import {ProgrammingLanguage} from "../../ProgrammingLanguage";

const tabCompletionKeyMap = [{ key: "Tab", run: acceptCompletion }];
const languageExtensions: Record<ProgrammingLanguage, LanguageSupport> = {
    JavaScript: javascript(),
    Python: python()
}

@customElement('p-code-editor')
export class CodeEditor extends CodeMirrorEditor {
    private testCodeExtension: TestCodeExtension;

    static get styles() {
        return css`
            :host {
                width: 100%;
                height: 100%;
            }

            .papyros-test-code {
                background-color: rgba(143, 182, 130, 0.1);
            }

            .papyros-test-code.cm-activeLine {
                background-color: rgba(143, 182, 130, 0.1)
            }
            
            .papyros-test-code-widget {
                background-color: rgba(143, 182, 130, 0.1);
                color: #7d8799;
                padding: 0 2px 0 6px;
                position: relative;
            }

            .papyros-test-code-buttons {
                position: absolute;
                top: -2px;
                left: -42px;
                z-index: 220;
            }

            .papyros-icon-link {
                font-size: 16px;
                padding: 2px;
                cursor: pointer;
            }

            .papyros-icon-link:hover {
                color: rgba(143, 182, 130);
            }
        `;
    }

    set debug(value: boolean) {
        this.configure({
            debugging: value ? debugExtension() : [
                highlightActiveLineGutter(),
                lintGutter(),
                highlightActiveLine()
            ]
        })
    }

    set debugLine(value: number | undefined) {
        this.view?.dispatch({
            effects: markDebugLine.of(value),
        });
    }

    set testCode(value: string) {
        if (!this.testCodeExtension) return;
        this.testCodeExtension.testCode = value;
    }

    set programmingLanguage(value: string) {
        if (!(value in languageExtensions)) {
            console.warn(`Language ${value} not supported, defaulting to javascript`);
            this.configure({
                language: languageExtensions["javascript"],
            })
            return;
        }

        this.configure({
            language: languageExtensions[value],
        });
    }

    set lintingSource( lintSource: () => Promise<readonly WorkerDiagnostic[]>) {
        this.configure({
            linting: linter(async (view) => {
                const workerDiagnostics = await lintSource();
                return workerDiagnostics.map(d => {
                    const fromline = view.state.doc.line(d.lineNr);
                    const toLine = view.state.doc.line(d.endLineNr);
                    const from = Math.min(fromline.from + d.columnNr, fromline.to);
                    const to = Math.min(toLine.from + d.endColumnNr, toLine.to);
                    return { ...d, from: from, to: to };
                })
            })
        })
    }

    set indentLength(length: number) {
        this.configure({
            indentUnit: indentUnit.of(" ".repeat(length))
        });
    }

    constructor() {
        super();
        this.configure({
            language: [],
            codingExtensions: [
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
               highlightSelectionMatches(),
               keymap.of([
                   ...closeBracketsKeymap,
                   ...defaultKeymap,
                   ...searchKeymap,
                   ...historyKeymap,
                   ...completionKeymap,
                   ...tabCompletionKeyMap,
                   ...lintKeymap,
                   indentWithTab
               ]),
            ],
            tests: (view) => {
                this.testCodeExtension = new TestCodeExtension(view);
                return this.testCodeExtension.toExtension();
            },
            debugging: [
                highlightActiveLineGutter(),
                lintGutter(),
                highlightActiveLine()
            ],
        });
    }
}