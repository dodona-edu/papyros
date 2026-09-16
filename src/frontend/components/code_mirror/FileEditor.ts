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
import { languageForFileName } from "./Languages";

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

    // Lit reuses this element across file tabs, so the language follows the
    // file name rather than being set once.
    set fileName(name: string) {
        this.configure({ language: languageForFileName(name) });
    }

    constructor() {
        super();
        this.configure({
            language: [],
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
