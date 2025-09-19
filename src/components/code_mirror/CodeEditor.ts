import {customElement, property} from "lit/decorators.js";
import {CodeMirrorEditor} from "./CodeMirrorEditor";
import {
    drawSelection, highlightActiveLine,
    highlightActiveLineGutter,
    highlightSpecialChars,
    keymap,
    lineNumbers,
    rectangularSelection
} from "@codemirror/view";
import {defaultKeymap, history, historyKeymap, indentWithTab} from "@codemirror/commands";
import {bracketMatching, foldGutter, indentOnInput} from "@codemirror/language";
import {EditorState} from "@codemirror/state";
import {
    acceptCompletion,
    autocompletion,
    closeBrackets,
    closeBracketsKeymap,
    completionKeymap
} from "@codemirror/autocomplete";
import {highlightSelectionMatches, searchKeymap} from "@codemirror/search";
import {lintGutter, lintKeymap} from "@codemirror/lint";
import {debugExtension, markDebugLine} from "./DebugExtension";
import {TestCodeExtension} from "./TestCodeExtension";
import {css} from "lit";

const tabCompletionKeyMap = [{ key: "Tab", run: acceptCompletion }];

@customElement('p-code-editor')
export class CodeEditor extends CodeMirrorEditor {
    private testCodeExtension: TestCodeExtension;

    static get styles() {
        return css`
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

    @property({type: Boolean})
    set debug(value: boolean) {
        this.configure({
            debugging: value ? debugExtension() : [
                highlightActiveLineGutter(),
                lintGutter(),
                highlightActiveLine()
            ]
        })
    }

    @property({type: Number, attribute: "debug-line"})
    set debugLine(value: number | undefined) {
        this.view?.dispatch({
            effects: markDebugLine.of(value),
        });
    }

    @property({type: String, attribute: "test-code"})
    set testCode(value: string) {
        if (!this.testCodeExtension) return;
        this.testCodeExtension.testCode = value;
    }

    constructor() {
        super();
        this.configure({
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
               console.log("initialize test code");
                this.testCodeExtension = new TestCodeExtension(view);
                return this.testCodeExtension.toExtension();
            },
            debugging: [
                highlightActiveLineGutter(),
                lintGutter(),
                highlightActiveLine()
            ]
        });
    }
}