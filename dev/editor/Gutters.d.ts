import { StateEffectType, StateField } from "@codemirror/state";
import { Extension } from "@codemirror/state";
import { GutterMarker } from "@codemirror/view";
import { EditorView } from "@codemirror/view";
/**
 * Data used in Gutter elements
 */
export interface GutterInfo {
    /**
     * The number of the line (1-based)
     */
    lineNr: number;
    /**
     * Whether the Gutter element should be shown
     */
    on: boolean;
}
/**
 * Configuration for Gutters
 */
export interface IGutterConfig<Info extends GutterInfo> {
    /**
     * Name of this Gutter
     */
    name: string;
    /**
     * HTML class names for the marker icons
     */
    markerClasses?: string;
    /**
     * Handler for when a Gutter element is clicked
     */
    onClick?: (view: EditorView, info: Info) => void;
    /**
     * Extra extensions to use for the Gutters
     */
    extraExtensions?: Extension;
}
export declare abstract class Gutters<Info extends GutterInfo = GutterInfo, Config extends IGutterConfig<Info> = IGutterConfig<Info>> {
    /**
     * Config used to initialize the Gutters
     */
    protected config: Config;
    /**
     * Effect to signal changes in the Gutters
     */
    protected effect: StateEffectType<Info>;
    /**
     * Current state of the Gutters
     * Consists of a mapping for line numbers to Info objects
     */
    protected state: StateField<Map<number, Info>>;
    constructor(config: Config);
    /**
     * Render a marker with the given info
     * @param {Info} info Info used to render the marker
     * Will only be called when info.on is True
     */
    protected abstract marker(info: Info): GutterMarker;
    private applyClasses;
    hasMarker(view: EditorView, lineNr: number): boolean;
    /**
     * Set a marker with the given info
     * @param {EditorView} view View in which the Gutters live
     * @param {Info} info Info used to render the marker
     */
    setMarker(view: EditorView, info: Info): void;
    /**
     * @param {EditorView} view The view in which the Gutters live
     * @return {Set<number>} The 1-based line numbers with a breakpoint
     */
    getMarkedLines(view: EditorView): Set<number>;
    /**
     * @return {Extension} The Gutters as a CodeMirror Extension
     */
    toExtension(): Extension;
}
/**
 * Gutters to show and allow toggling of breakpoints
 */
export declare class BreakpointsGutter extends Gutters {
    constructor();
    protected marker(): GutterMarker;
}
/**
 * Extra data used to represent input gutters
 */
export interface UsedInputGutterInfo extends GutterInfo {
    /**
     * Text value to display when hovering over the Gutter element
     */
    title: string;
}
/**
 * Gutters to show a checkmark for used input
 */
export declare class UsedInputGutters extends Gutters<UsedInputGutterInfo> {
    constructor();
    protected marker(info: UsedInputGutterInfo): GutterMarker;
}
/**
 * shows the debugged line
 */
export declare class DebugLineGutter extends Gutters<GutterInfo> {
    private activeLine;
    constructor();
    protected marker(): GutterMarker;
    markLine(view: EditorView, lineNr: number): void;
}
