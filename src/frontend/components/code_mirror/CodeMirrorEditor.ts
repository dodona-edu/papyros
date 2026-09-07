import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { EditorView, ViewUpdate, placeholder } from "@codemirror/view";
import { Compartment, EditorState, Extension, StateEffect } from "@codemirror/state";

// Keep gutters out of native text selection: with drawSelection() active the
// browser's own selection is invisible over the code, so a page-wide select-all
// would highlight (and copy) only the line numbers.
const gutterSelectionTheme = EditorView.theme({
    ".cm-gutters": {
        userSelect: "none",
        "-webkit-user-select": "none",
    },
});

@customElement("p-code-mirror-editor")
export class CodeMirrorEditor extends LitElement {
    private __value: string = "";
    private __readonly: boolean = false;
    protected view: EditorView | undefined;
    protected readonly compartments: Map<string, Compartment> = new Map();
    protected readonly extensions: Map<string, Extension> = new Map();

    public set value(value: string) {
        if (this.__value === value) return;
        this.__value = value;
        if (!this.view) return;

        this.dispatchChange();
    }

    public set readonly(readonly: boolean) {
        // EditorState.readOnly instead of EditorView.editable: the view stays
        // focusable, so keyboard selection (e.g. cmd+a) keeps working.
        this.configure({
            readonly: EditorState.readOnly.of(readonly),
        });
        this.__readonly = readonly;
    }

    protected dispatchChange(): void {
        if (!this.view) return;
        this.configure({ readonly: EditorState.readOnly.of(true) });
        this.view.dispatch({
            changes: {
                from: 0,
                to: this.view.state.doc.length,
                insert: this.__value,
            },
        });
        this.configure({ readonly: EditorState.readOnly.of(this.__readonly) });
    }

    public get value(): string {
        return this.__value;
    }

    set placeholder(value: string) {
        this.configure({
            placeholder: placeholder(value),
        });
    }

    // Accessible name for .cm-content, since CodeMirror itself doesn't label it.
    set accessibleName(value: string) {
        this.configure({
            accessibleName: EditorView.contentAttributes.of({ "aria-label": value }),
        });
    }

    set theme(theme: Extension) {
        this.configure({ theme: theme });
    }

    set translations(translations: Record<string, string>) {
        this.configure({ translations: EditorState.phrases.of(translations) });
    }

    private initView(): void {
        this.view = new EditorView({
            parent: this.shadowRoot as ShadowRoot,
            state: EditorState.create({
                doc: this.__value,
                extensions: [
                    EditorView.updateListener.of(this.onViewUpdate.bind(this)),
                    gutterSelectionTheme,
                    [...this.compartments.keys().map((k) => this.compartments.get(k)!.of([]))],
                ],
            }),
        });
        this.configure(Object.fromEntries(this.extensions));
    }

    private onViewUpdate(v: ViewUpdate): void {
        if (v.docChanged) {
            this.__value = v.state.doc.toString();
            this.dispatchEvent(new CustomEvent("change", { detail: this.value }));
        }
    }

    public override connectedCallback(): void {
        super.connectedCallback();
        this.initView();
    }

    public focus(): void {
        this.view?.focus();
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

        const effects = Object.keys(extensions).map((key) => {
            const extension = extensions[key];
            if (this.compartments.has(key)) {
                return this.compartments.get(key)!.reconfigure(extension);
            }

            const compartment = new Compartment();
            this.compartments.set(key, compartment);
            return StateEffect.appendConfig.of(compartment.of(extension));
        });

        if (this.view) {
            this.view.dispatch({ effects });
        }
    }
}
