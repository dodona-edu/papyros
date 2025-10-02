import { customElement, property } from "lit/decorators.js";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { EditorView, keymap } from "@codemirror/view";
import { css, CSSResult } from "lit";
import { defaultKeymap } from "@codemirror/commands";
import { setUsedLines, usedLineExtension } from "./Extensions";

@customElement("p-batch-input-editor")
export class BatchInputEditor extends CodeMirrorEditor {

    @property({ type: Number })
    set usedLines(value: number) {
        const lines = Array.from({ length: value }, (a, i) => i+1)
        this.view?.dispatch({
            effects: setUsedLines.of(lines),
        })
    }

    @property({ type: Boolean })
    set readOnly(value: boolean) {
        this.configure({
            debugging: value ? EditorView.editable.of(false): [],
        })
    }

    constructor() {
        super();
        this.configure({
            default: [
                usedLineExtension,
                keymap.of(defaultKeymap),
            ]
        })
    }

}