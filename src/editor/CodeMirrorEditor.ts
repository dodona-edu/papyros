import { Compartment, EditorState, Extension, StateEffect } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { Renderable, RenderOptions, renderWithOptions } from "../util/Rendering";
import { StyleSpec } from "style-mod";

export interface EditorStyling {
    classes: Array<string>;
    maxHeight: string;
    minHeight: string;
    theme?: {
        [selectorSpec: string]: StyleSpec
    }
}

export interface CodeChangeListener {
    onChange: (code: string) => void;
    delay?: number;
}
interface TimeoutData {
    lastCalled: number;
    timeout: NodeJS.Timeout | null;
}

export abstract class CodeMirrorEditor extends Renderable {
    readonly editorView: EditorView;
    protected compartments: Map<string, Compartment>;
    protected htmlClasses: Array<string>;
    /**
     * Mapping for each change listener to its timeout identifier and last call time
     */
    protected listenerTimeouts: Map<CodeChangeListener, TimeoutData>;

    constructor(compartments: Array<string>, styling: EditorStyling) {
        super();
        this.htmlClasses = styling.classes;
        this.listenerTimeouts = new Map();
        this.compartments = new Map(compartments.map(opt => [opt, new Compartment()]));
        const configurableExtensions = [...this.compartments.values()]
            .map(compartment => compartment.of([]));
        this.editorView = new EditorView({
            state: EditorState.create({
                extensions: [
                    configurableExtensions,
                    EditorView.updateListener.of((v: ViewUpdate) => {
                        if (v.docChanged) {
                            this.handleChange();
                        }
                    }),
                    EditorView.theme({
                        ".cm-scroller": { overflow: "auto" },
                        "&": { maxHeight: styling.maxHeight },
                        ".cm-gutter,.cm-content": { minHeight: styling.minHeight },
                        ...(styling.theme || {})
                    })
                ]
            })
        });
    }

    protected addExtension(extension: Extension): void {
        this.editorView.dispatch({
            effects: StateEffect.appendConfig.of(extension)
        });
    }

    /**
     * @return {string} The text within the editor
     */
    public getText(): string {
        return this.editorView.state.doc.toString();
    }

    /**
     * @param {string} text The new value to be shown in the editor
     */
    public setText(text: string): void {
        this.editorView.dispatch(
            { changes: { from: 0, to: this.getText().length, insert: text } }
        );
    }

    /**
     * Helper method to dispatch configuration changes at runtime
     * @param {Array<[Option, Extension]>} items Array of items to reconfigure
     * The option indicates the relevant compartment
     * The extension indicates the new configuration
     */
    public reconfigure(...items: Array<[string, Extension]>): void {
        this.editorView.dispatch({
            effects: items.map(([opt, ext]) => this.compartments.get(opt)!.reconfigure(ext))
        });
    }

    public focus(): void {
        this.editorView.focus();
    }

    protected override _render(options: RenderOptions): void {
        const wrappingDiv = document.createElement("div");
        wrappingDiv.classList.add(...this.htmlClasses);
        wrappingDiv.replaceChildren(this.editorView.dom);
        renderWithOptions(options, wrappingDiv);
    }

    private handleChange(): void {
        const currentDoc = this.getText();
        const now = Date.now();
        this.listenerTimeouts.forEach((timeoutData, listener) => {
            if (timeoutData.timeout !== null) {
                clearTimeout(timeoutData.timeout);
            }
            timeoutData.timeout = setTimeout(() => {
                timeoutData.timeout = null;
                listener.onChange(currentDoc);
            }, listener.delay);
            timeoutData.lastCalled = now;
        });
    }

    /**
     * @param {CodeChangeListener} changeListener Listener that performs actions on the new contents
     */
    public onChange(changeListener: CodeChangeListener): void {
        this.listenerTimeouts.set(changeListener, { timeout: null, lastCalled: 0 });
    }
}
