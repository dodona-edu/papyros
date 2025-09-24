import {LitElement} from "lit";
import { customElement, property } from "lit/decorators.js";
import {EditorView, ViewUpdate} from "@codemirror/view";
import {Compartment, EditorState, Extension, StateEffect} from "@codemirror/state";

type extensionFactory = (view: EditorView) => Extension;
type ExtensionOrFactory = Extension | extensionFactory;

@customElement('p-code-mirror-editor')
export class CodeMirrorEditor extends LitElement {
    private __value: string = '';
    protected view: EditorView | undefined;
    private readonly compartments: Map<string, Compartment> = new Map();
    private readonly extensions: Map<string, ExtensionOrFactory> = new Map();

    @property({type: String})
    public set value(value: string) {
        if(this.__value === value) return;
        this.__value = value;
        if (!this.view) return;

        const data = {
            changes: {
                from: 0,
                to: this.view.state.doc.length,
                insert: this.__value
            }
        };
        this.view.dispatch(this.view.state.update(data));
    }

    public get value(): string {
        return this.__value;
    }

    set theme(theme: Record<string, any>) {
            this.configure({ theme: EditorView.theme({
                    ".cm-scroller": { overflow: "auto" },
                    "&": {
                        "height": "100%",
                        "width": "100%",
                        "font-size": "14px" // use proper size to align gutters with editor
                    },
                    ...theme
                }) });
    }

    private initView() {
        this.theme = {};
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

    protected configure(extensions: Record<String, ExtensionOrFactory>) {
        Object.entries(extensions).forEach(([key, ext]) => {
            this.extensions.set(key, ext as ExtensionOrFactory);
        });


        if (this.view) {
            const effects =  Object.keys(extensions).map(key => {
                let extension = extensions[key];
                if(typeof extension === "function") {
                    extension = (extension as extensionFactory)(this.view);
                }

                if(this.compartments.has(key)) {
                    return this.compartments.get(key)!.reconfigure(extension)
                }

                const compartment = new Compartment();
                this.compartments.set(key, compartment);
                return StateEffect.appendConfig.of(compartment.of(extension));
            })
            this.view.dispatch({ effects});
        } else {
            Object.keys(extensions).filter(k => !this.compartments.has(k)).forEach(key => {
                const compartment = new Compartment();
                this.compartments.set(key, compartment);
            });
        }
    }
}