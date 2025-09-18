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

const tabCompletionKeyMap = [{ key: "Tab", run: acceptCompletion }];

@customElement('p-code-editor')
export class CodeEditor extends CodeMirrorEditor {
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
            debugging: [
                highlightActiveLineGutter(),
                lintGutter(),
                highlightActiveLine()
            ]
        });
    }
}