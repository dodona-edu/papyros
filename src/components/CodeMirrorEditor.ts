import {LitElement} from "lit";
import { customElement, property } from "lit/decorators.js";
import {EditorView, ViewUpdate} from "@codemirror/view";
import {EditorState, Extension} from "@codemirror/state";

@customElement('p-code-mirror-editor')
export class CodeMirrorEditor extends LitElement {
    private __value: string = '';
    private view: EditorView;

    @property({type: String})
    set value(value: string) {
        this.__value = value;
        if (!this.view) return;

        const data = {
            changes: { from: 0, insert: this.__value }
        };
        this.view.dispatch(this.view.state.update(data));
    }

    get value(): string {
        return this.__value;
    }

    initView() {
        this.view = new EditorView({
            parent: (this.shadowRoot as ShadowRoot),
            state: EditorState.create({ doc: this.__value, extensions: [...this.extensions] })
        });
    }

    get extensions(): Extension[] {
        return [
            EditorView.updateListener.of(this.onViewUpdate.bind(this))
        ];
    }

    onViewUpdate(v: ViewUpdate): void {
        if (v.docChanged) {
            this.__value = v.state.doc.toString();
            this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this.initView();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.view.destroy();
    }
}