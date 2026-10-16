import { customElement } from "lit/decorators.js";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
import {
    drawSelection,
    highlightActiveLine,
    highlightActiveLineGutter,
    highlightSpecialChars,
    keymap,
    lineNumbers,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { bracketMatching, foldGutter, indentOnInput } from "@codemirror/language";
import { EditorState, Extension } from "@codemirror/state";
import { highlightSelectionMatches } from "@codemirror/search";
import { css, CSSResult } from "lit";
import { languageForFileName } from "./Languages";

const fileExtensions: Extension = [
    lineNumbers(),
    highlightSpecialChars(),
    foldGutter(),
    drawSelection(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    highlightSelectionMatches(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
];

@customElement("p-file-editor")
export class FileEditor extends CodeMirrorEditor {
    static get styles(): CSSResult {
        return css`
            :host {
                width: 100%;
                height: 100%;
            }
        `;
    }

    // The language depends on the file name, which the viewer only passes in after the
    // editor is constructed.
    set fileName(name: string) {
        this.configure({ language: languageForFileName(name) });
    }

    constructor() {
        super();
        this.configure({
            language: [],
            history: history(),
            fileExtensions,
        });
    }
}
