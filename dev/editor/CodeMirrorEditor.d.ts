/// <reference types="node" />
import { Compartment, Extension } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { Renderable, RenderOptions } from "../util/Rendering";
import { StyleSpec } from "style-mod";
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
        [selectorSpec: string]: StyleSpec;
    };
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
export declare abstract class CodeMirrorEditor extends Renderable {
    static STYLE: string;
    static PLACEHOLDER: string;
    static THEME: string;
    static LANGUAGE: string;
    /**
     * CodeMirror EditorView representing the internal editor
     */
    readonly editorView: EditorView;
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
    constructor(compartments: Set<string>, styling: EditorStyling);
    protected onViewUpdate(v: ViewUpdate): void;
    /**
     * @param {Extension} extension The extension to add to the Editor
     */
    protected addExtension(extension: Extension): void;
    /**
     * @return {string} The text within the editor
     */
    getText(): string;
    /**
     * @param {string} text The new value to be shown in the editor
     */
    setText(text: string): void;
    /**
     * Helper method to dispatch configuration changes at runtime
     * @param {Array<[Option, Extension]>} items Array of items to reconfigure
     * The option indicates the relevant compartment
     * The extension indicates the new configuration
     */
    reconfigure(...items: Array<[string, Extension]>): void;
    /**
     * Apply focus to the Editor
     */
    focus(): void;
    /**
     * @param {string} placeholderValue The contents of the placeholder
     */
    setPlaceholder(placeholderValue: string): void;
    /**
     * @param {boolean} darkMode Whether to use dark mode
     */
    setDarkMode(darkMode: boolean): void;
    /**
     * Override the style used by this Editor
     * @param {Partial<EditorStyling>} styling Object with keys of EditorStyling to override styles
     */
    setStyling(styling: Partial<EditorStyling>): void;
    protected _render(options: RenderOptions): void;
    /**
     * Process the changes by informing the listeners of the new contents
     */
    private handleChange;
    /**
     * @param {DocChangeListener} changeListener Listener that performs actions on the new contents
     */
    onChange(changeListener: DocChangeListener): void;
}
export {};
