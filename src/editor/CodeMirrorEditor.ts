import { Compartment, EditorState, Extension, StateEffect } from "@codemirror/state";
import { EditorView, placeholder, ViewUpdate } from "@codemirror/view";
import { Renderable, RenderOptions, renderWithOptions } from "../util/Rendering";
import { StyleSpec } from "style-mod";
import { darkTheme } from "./DarkTheme";

/**
 * Data structure containing common elements for styling
 */
export interface EditorStyling {
    /**
     * Array of HTML classes to apply to this editor
     */
    classes: Array<string>;
    /**
     * The maximum height of the editor
     */
    maxHeight: string;
    /**
     * The minimum height of the editor
     */
    minHeight: string;
    /**
     * Extra theme options to be passed to EditorView.theme
     */
    theme?: {
        [selectorSpec: string]: StyleSpec
    }
}

/**
 * Interface for listeners to textual changes in the editor
 */
export interface DocChangeListener {
    /**
     * Method to call with the new document value
     */
    onChange: (code: string) => void;
    /**
     * How many milliseconds should pass since the last change
     * before notifying (in case computations are expensive)
     */
    delay?: number;
}

/**
 * Interface for storing data related to delayed function calls
 */
interface TimeoutData {
    /**
     * The time in ms at which the last call occurred
     */
    lastCalled: number;
    /**
     * The timeout identifier associated with the delayed call
     * null if not currently scheduled
     */
    timeout: NodeJS.Timeout | null;
}


/**
 * Base class for Editors implemented using CodeMirror 6
 * https://codemirror.net/6/
 */
export abstract class CodeMirrorEditor extends Renderable {
    public static STYLE = "style";
    public static PLACEHOLDER = "placeholder";
    public static THEME = "theme";
    /**
     * CodeMirror EditorView representing the internal editor
     */
    public readonly editorView: EditorView;
    /**
     * Mapping of strings to Compartments associated with that property
     */
    protected compartments: Map<string, Compartment>;
    /**
     * Data to style this Editor
     */
    protected styling: EditorStyling;
    /**
     * Mapping for each change listener to its timeout identifier and last call time
     */
    protected listenerTimeouts: Map<DocChangeListener, TimeoutData>;

    /**
     * @param {Set<string>} compartments Identifiers for configurable extensions
     * @param {EditorStyling} styling Data to style this editor
     */
    constructor(compartments: Set<string>, styling: EditorStyling) {
        super();
        this.styling = styling;
        this.listenerTimeouts = new Map();
        // Ensure default compartments are present
        compartments.add(CodeMirrorEditor.STYLE);
        compartments.add(CodeMirrorEditor.PLACEHOLDER);
        compartments.add(CodeMirrorEditor.THEME);
        this.compartments = new Map();
        const configurableExtensions: Array<Extension> = [];
        compartments.forEach(opt => {
            const compartment = new Compartment();
            this.compartments.set(opt, compartment);
            configurableExtensions.push(compartment.of([]));
        });
        this.editorView = new EditorView({
            state: EditorState.create({
                extensions: [
                    configurableExtensions,
                    EditorView.updateListener.of(this.onViewUpdate.bind(this))
                ]
            })
        });
    }

    protected onViewUpdate(v: ViewUpdate): void {
        if (v.docChanged) {
            this.handleChange();
        }
    }

    /**
     * @param {Extension} extension The extension to add to the Editor
     */
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

    /**
     * Apply focus to the Editor
     */
    public focus(): void {
        this.editorView.focus();
    }

    /**
     * @param {string} placeholderValue The contents of the placeholder
     */
    public setPlaceholder(placeholderValue: string): void {
        this.reconfigure([
            CodeMirrorEditor.PLACEHOLDER,
            placeholder(placeholderValue)
        ]);
    }

    /**
     * @param {boolean} darkMode Whether to use dark mode
     */
    public setDarkMode(darkMode: boolean): void {
        let styleExtensions: Extension = [];
        if (darkMode) {
            styleExtensions = [darkTheme];
        }
        this.reconfigure([CodeMirrorEditor.STYLE, styleExtensions]);
    }

    /**
     * Override the style used by this Editor
     * @param {Partial<EditorStyling>} styling Object with keys of EditorStyling to override styles
     */
    public setStyling(styling: Partial<EditorStyling>): void {
        Object.assign(this.styling, styling);
        this.reconfigure([
            CodeMirrorEditor.THEME,
            EditorView.theme({
                ".cm-scroller": { overflow: "auto" },
                "&": {
                    "maxHeight": this.styling.maxHeight, "height": "100%",
                    "font-size": "14px" // use proper size to align gutters with editor
                },
                ".cm-gutter,.cm-content": { minHeight: this.styling.minHeight },
                ...(this.styling.theme || {})
            })
        ]);
    }

    protected override _render(options: RenderOptions): void {
        this.setStyling(this.styling);
        this.setDarkMode(options.darkMode || false);
        const wrappingDiv = document.createElement("div");
        wrappingDiv.classList.add(...this.styling.classes);
        wrappingDiv.replaceChildren(this.editorView.dom);
        renderWithOptions(options, wrappingDiv);
    }

    /**
     * Process the changes by informing the listeners of the new contents
     */
    private handleChange(): void {
        const currentDoc = this.getText();
        const now = Date.now();
        this.listenerTimeouts.forEach((timeoutData, listener) => {
            // Clear existing scheduled calls
            if (timeoutData.timeout !== null) {
                clearTimeout(timeoutData.timeout);
            }
            timeoutData.lastCalled = now;
            if (listener.delay && listener.delay > 0) {
                timeoutData.timeout = setTimeout(() => {
                    timeoutData.timeout = null;
                    listener.onChange(currentDoc);
                }, listener.delay);
            } else {
                listener.onChange(currentDoc);
            }
            timeoutData.lastCalled = now;
        });
    }

    /**
     * @param {DocChangeListener} changeListener Listener that performs actions on the new contents
     */
    public onChange(changeListener: DocChangeListener): void {
        this.listenerTimeouts.set(changeListener, { timeout: null, lastCalled: 0 });
    }
}
