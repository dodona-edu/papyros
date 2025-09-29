import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { EditorView, ViewUpdate, placeholder } from "@codemirror/view";
import { Compartment, EditorState, Extension, StateEffect } from "@codemirror/state";

@customElement("p-code-mirror-editor")
export class CodeMirrorEditor extends LitElement {
    private __value: string = "";
    protected view: EditorView | undefined;
    protected readonly compartments: Map<string, Compartment> = new Map();
    protected readonly extensions: Map<string, Extension> = new Map();

    public set value(value: string) {
        if(this.__value === value) return;
        this.__value = value;
        if (!this.view) return;

        this.dispatchChange()
    }

    protected dispatchChange(): void {
        if (!this.view) return;
        this.view.dispatch({
            changes: {
                from: 0,
                to: this.view.state.doc.length,
                insert: this.__value
            }
        });
    }

    public get value(): string {
        return this.__value;
    }

    set placeholder(value: string) {
        this.configure({
            placeholder: placeholder(value),
        })
    }

    set theme(theme: Extension) {
        this.configure({ theme: theme });
    }

    set translations(translations: Record<string, string>) {
        this.configure({ translations: EditorState.phrases.of(translations) });
    }

    private initView(): void {
        this.view = new EditorView({
            parent: (this.shadowRoot as ShadowRoot),
            state: EditorState.create({ doc: this.__value, extensions: [
                EditorView.updateListener.of(this.onViewUpdate.bind(this)),
                [...this.compartments.keys().map(k => this.compartments.get(k)!.of([]))],
            ] })
        });
        this.configure(Object.fromEntries(this.extensions));
    }

    private onViewUpdate(v: ViewUpdate): void {
        if (v.docChanged) {
            this.__value = v.state.doc.toString();
            this.dispatchEvent(new CustomEvent("change", { detail: this.value }))
        }
    }

    public override connectedCallback(): void {
        super.connectedCallback();
        this.initView();
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.view?.destroy();
        this.view = undefined;
    }

    protected configure(extensions: Record<string, Extension>): void {
        Object.entries(extensions).forEach(([key, ext]) => {
            this.extensions.set(key, ext as Extension);
        });

        const effects =  Object.keys(extensions).map(key => {
            const extension = extensions[key];
            if(this.compartments.has(key)) {
                return this.compartments.get(key)!.reconfigure(extension)
            }

            const compartment = new Compartment();
            this.compartments.set(key, compartment);
            return StateEffect.appendConfig.of(compartment.of(extension));
        })


        if (this.view) {
            this.view.dispatch({ effects });
        }
    }
}