import { customElement, property } from "lit/decorators.js";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { css, CSSResult } from "lit";
import { defaultKeymap } from "@codemirror/commands";
import { setUsedLines, usedLineExtension } from "./Extensions";

@customElement("p-batch-input-editor")
export class BatchInputEditor extends CodeMirrorEditor {
    static get styles(): CSSResult {
        return css`
            :host {
                width: 100%;
                height: 100%;
            }
        `;
    }

    @property({ type: Number })
    set usedLines(value: number) {
        const lines = Array.from({ length: value }, (a, i) => i + 1);
        this.view?.dispatch({
            effects: setUsedLines.of(lines),
        });
    }

    @property({ type: Boolean })
    set readOnly(value: boolean) {
        this.configure({
            debugging: value ? EditorState.readOnly.of(true) : [],
        });
    }

    constructor() {
        super();
        this.configure({
            default: [usedLineExtension, keymap.of(defaultKeymap)],
        });
    }
}
