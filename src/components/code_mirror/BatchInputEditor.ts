import {customElement, property} from "lit/decorators.js";
import {CodeMirrorEditor} from "./CodeMirrorEditor";
import {EditorView, placeholder} from "@codemirror/view";
import {markUsedLines, usedLineExtension} from "./UsedLineExtension";

@customElement('p-batch-input-editor')
export class BatchInputEditor extends CodeMirrorEditor {
    @property({type: String})
    set placeholder(value: string) {
        this.configure({
            placeholder: placeholder(value),
        })
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
            ]
        })
    }

}