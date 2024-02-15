import { StateEffectType, StateField } from "@codemirror/state";
import { Extension, StateEffect } from "@codemirror/state";
import { BlockInfo, gutter, GutterMarker } from "@codemirror/view";
import { EditorView } from "@codemirror/view";
import { appendClasses } from "../util/Rendering";

/**
 * Helper class to create markers in the gutter
 */
class SimpleMarker extends GutterMarker {
    constructor(
        // Function to create the DOM element
        private createMarker: () => Text
    ) {
        super();
    }
    public override toDOM(): Text {
        return this.createMarker();
    }
}
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
    onClick?: (view: EditorView, info: Info) => void,
    /**
     * Extra extensions to use for the Gutters
     */
    extraExtensions?: Extension;
}
export abstract class Gutters<
    Info extends GutterInfo = GutterInfo,
    Config extends IGutterConfig<Info> = IGutterConfig<Info>,
    > {
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

    constructor(config: Config) {
        this.config = config;
        this.effect = StateEffect.define<Info>();
        this.state = StateField.define<Map<number, GutterInfo>>({
            create: () => {
                return new Map();
            },
            update: (current, transaction) => {
                const updatedMap: Map<number, GutterInfo> = new Map(current);
                for (const e of transaction.effects) {
                    if (e.is(this.effect)) {
                        updatedMap.set(e.value.lineNr, e.value);
                    }
                }
                return updatedMap;
            }
        });
    }

    /**
     * Render a marker with the given info
     * @param {Info} info Info used to render the marker
     * Will only be called when info.on is True
     */
    protected abstract marker(info: Info): GutterMarker;

    private applyClasses(marker: GutterMarker): GutterMarker {
        const classes = { classNames: this.config.markerClasses };
        appendClasses(classes, "_tw-px-1 papyros-gutter-marker");
        marker.elementClass += classes.classNames;
        return marker;
    }

    public hasMarker(view: EditorView, lineNr: number): boolean {
        const guttersInfo: Map<number, GutterInfo> = view.state.field(this.state);
        return guttersInfo.has(lineNr) && guttersInfo.get(lineNr)!.on;
    }

    /**
     * Set a marker with the given info
     * @param {EditorView} view View in which the Gutters live
     * @param {Info} info Info used to render the marker
     */
    public setMarker(view: EditorView, info: Info): void {
        if (this.hasMarker(view, info.lineNr) !== info.on) {
            view.dispatch({
                effects: this.effect.of(info)
            });
        }
    }

    /**
     * @param {EditorView} view The view in which the Gutters live
     * @return {Set<number>} The 1-based line numbers with a breakpoint
     */
    public getMarkedLines(view: EditorView): Set<number> {
        const markedLines: Set<number> = new Set();
        const guttersInfo: Map<number, GutterInfo> = view.state.field(this.state);
        guttersInfo.forEach((info: GutterInfo, lineNr: number) => {
            if (info.on) {
                markedLines.add(lineNr);
            }
        });
        return markedLines;
    }

    /**
     * @return {Extension} The Gutters as a CodeMirror Extension
     */
    toExtension(): Extension {
        // TODO correct type: https://github.com/codemirror/codemirror.next/issues/839
        const handlers: any = {};
        if (this.config.onClick) {
            handlers["mousedown"] = (view: EditorView, line: BlockInfo) => {
                const markings = view.state.field(this.state);
                const lineNr = view.state.doc.lineAt(line.from).number;
                const markerInfo = markings.get(lineNr)!;
                // Line numbers start at 1
                this.config.onClick!(view, markerInfo);
            };
        }
        return [
            this.state,
            gutter({
                class: `cm-${this.config.name}-gutter`,
                lineMarker: (view, line) => {
                    // Lookup whether the element should be drawn
                    const guttersInfo: Map<number, Info> = view.state.field(this.state);
                    const lineNr = view.state.doc.lineAt(line.from).number;
                    if (guttersInfo.has(lineNr) && guttersInfo.get(lineNr)!.on) {
                        return this.applyClasses(this.marker(guttersInfo.get(lineNr)!));
                    } else {
                        return null;
                    }
                },
                lineMarkerChange: update => {
                    return update.startState.field(this.state) !== update.state.field(this.state);
                },
                initialSpacer: () => {
                    return this.applyClasses(this.marker({ lineNr: -1, on: true } as Info)!);
                },
                domEventHandlers: handlers
            }),
            this.config.extraExtensions || []
        ];
    }
}

/**
 * Gutters to show and allow toggling of breakpoints
 */
export class BreakpointsGutter extends Gutters {
    constructor() {
        super({
            name: "breakpoint",
            onClick: (view: EditorView, info: GutterInfo) => {
                info.on = !info.on;
                this.setMarker(view, info);
            },
            extraExtensions: [
                EditorView.baseTheme({
                    ".cm-breakpoint-gutter .cm-gutterElement": {
                        color: "red",
                        paddingLeft: "5px",
                        cursor: "default"
                    }
                })
            ]
        });
    }

    protected override marker(): GutterMarker {
        return new SimpleMarker(() => document.createTextNode("🔴"));
    }
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
export class UsedInputGutters extends Gutters<UsedInputGutterInfo> {
    constructor() {
        super({
            name: "input"
        });
    }

    protected override marker(info: UsedInputGutterInfo): GutterMarker {
        return new SimpleMarker(() => {
            const node = document.createElement("div");
            node.replaceChildren(document.createTextNode("✔"));
            node.setAttribute("title", info.title);
            // Text interface tells us that more complex node will be processed into Text nodes
            return node as any as Text;
        });
    }
}

/**
 * shows the debugged line
 */
export class DebugLineGutter extends Gutters<GutterInfo> {
    private activeLine: number = 1;

    constructor() {
        super({
            name: "debugline",
            extraExtensions: [
                EditorView.baseTheme({
                    ".cm-debugline-gutter .cm-gutterElement": {
                        lineHeight: "12px",
                        marginRight: "-5px",
                        fontSize: "40px"
                    }
                })
            ]
        });
    }

    protected override marker(): GutterMarker {
        return new SimpleMarker(() => document.createTextNode("⇨"));
    }

    public toggle(show: boolean): void {
        document.querySelector(".cm-debugline-gutter")?.classList.toggle("show", show);
    }

    public markLine(view: EditorView, lineNr: number): void {
        this.setMarker(view, { lineNr: this.activeLine, on: false });
        this.setMarker(view, { lineNr, on: true });
        this.activeLine = lineNr;
    }
}
