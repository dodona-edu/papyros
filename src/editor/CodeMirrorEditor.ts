import { Compartment, EditorState, Extension, StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
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
export abstract class CodeMirrorEditor extends Renderable {
    readonly editorView: EditorView;
    protected compartments: Map<string, Compartment>;
    protected htmlClasses: Array<string>;
    constructor(compartments: Array<string>, styling: EditorStyling) {
        super();
        this.htmlClasses = styling.classes;
        this.compartments = new Map(compartments.map(opt => [opt, new Compartment()]));
        const configurableExtensions = [...this.compartments.values()]
            .map(compartment => compartment.of([]));
        this.editorView = new EditorView({
            state: EditorState.create({
                extensions: [
                    configurableExtensions,
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

    public getLines(): Array<string> {
        const lines = [];
        let lineIterator = this.editorView.state.doc.iterLines();
        while (!lineIterator.done) {
            lines.push(lineIterator.value);
            lineIterator = lineIterator.next();
        }
        return lines;
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
}
