import {customElement} from "lit/decorators.js";
import {CodeMirrorEditor} from "./CodeMirrorEditor";
import {drawSelection, highlightSpecialChars, keymap, lineNumbers, rectangularSelection} from "@codemirror/view";
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
import {lintKeymap} from "@codemirror/lint";

const tabCompletionKeyMap = [{ key: "Tab", run: acceptCompletion }];

@customElement('p-code-editor')
export class CodeEditor extends CodeMirrorEditor {
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
           ]
        });
    }
}