import {customElement, property} from "lit/decorators.js";
import {CodeMirrorEditor} from "./CodeMirrorEditor";
import {EditorView, keymap} from "@codemirror/view";
import {markUsedLines, usedLineExtension} from "./UsedLineExtension";
import {css} from "lit";
import {defaultKeymap} from "@codemirror/commands";

@customElement('p-batch-input-editor')
export class BatchInputEditor extends CodeMirrorEditor {
    static get styles() {
        return css`
            :host {
                width: 100%;
                height: 100%;
            }
        `
    }

    @property({type: Number})
    set usedLines(value: number) {
        this.view?.dispatch({
            effects: markUsedLines.of(value),
        })
    }

    @property({type: Boolean})
    set readOnly(value: boolean) {
        this.configure({
            debugging: value ? EditorView.editable.of(false): [],
        })
    }

    constructor() {
        super();
        this.configure({
            default: [
                usedLineExtension(),
                keymap.of(defaultKeymap),
            ]
        })
    }

}