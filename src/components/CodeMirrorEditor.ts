import {LitElement} from "lit";
import { customElement, property } from "lit/decorators.js";
import {EditorView, ViewUpdate} from "@codemirror/view";
import {Compartment, EditorState, Extension, StateEffect} from "@codemirror/state";

@customElement('p-code-mirror-editor')
export class CodeMirrorEditor extends LitElement {
    private __value: string = '';
    private view: EditorView | undefined;
    private readonly compartments: Map<string, Compartment> = new Map();
    private readonly extensions: Map<string, Extension> = new Map();

    @property({type: String})
    public set value(value: string) {
        this.__value = value;
        if (!this.view) return;

        const data = {
            changes: { from: 0, insert: this.__value }
        };
        this.view.dispatch(this.view.state.update(data));
    }

    public get value(): string {
        return this.__value;
    }

    private initView() {
        this.view = new EditorView({
            parent: (this.shadowRoot as ShadowRoot),
            state: EditorState.create({ doc: this.__value, extensions: [
                    EditorView.updateListener.of(this.onViewUpdate.bind(this)),
                    [...this.compartments.keys().map(k => this.compartments.get(k)!.of(this.extensions.get(k)!))],
                ] })
        });
    }

    private onViewUpdate(v: ViewUpdate): void {
        if (v.docChanged) {
            this.__value = v.state.doc.toString();
            this.dispatchEvent(new CustomEvent('change', { detail: this.value }))
        }
    }

    protected override connectedCallback() {
        super.connectedCallback();
        this.initView();
    }

    protected override disconnectedCallback() {
        super.disconnectedCallback();
        this.view?.destroy();
        this.view = undefined;
    }

    protected configure(extensions: Record<String, Extension>) {
        Object.entries(extensions).forEach(([key, ext]) => {
            this.extensions.set(key, ext as Extension);
        });

        const effects =  Object.keys(extensions).map(key => {
            if(this.compartments.has(key)) {
                return this.compartments.get(key)!.reconfigure(this.extensions.get(key)!)
            }

            const compartment = new Compartment();
            this.compartments.set(key, compartment);
            return StateEffect.appendConfig.of(compartment.of(this.extensions.get(key)!));
        })

        if (this.view) {
            this.view.dispatch({ effects});
        }
    }
}