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
import { EditorState } from "@codemirror/state";
import { highlightSelectionMatches } from "@codemirror/search";
import { css, CSSResult } from "lit";

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

    constructor() {
        super();
        this.configure({
            fileExtensions: [
                lineNumbers(),
                highlightSpecialChars(),
                history(),
                foldGutter(),
                drawSelection(),
                EditorState.allowMultipleSelections.of(true),
                indentOnInput(),
                bracketMatching(),
                highlightSelectionMatches(),
                highlightActiveLineGutter(),
                highlightActiveLine(),
                keymap.of([...defaultKeymap, ...historyKeymap]),
            ],
        });
    }
}
