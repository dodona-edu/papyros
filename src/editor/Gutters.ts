import { StateEffectType, StateField } from "@codemirror/state";
import { Extension, StateEffect } from "@codemirror/state";
import { BlockInfo, gutter, GutterMarker } from "@codemirror/view";
import { EditorView } from "@codemirror/view";

class SimpleMarker extends GutterMarker {
    constructor(
        private createMarker: () => Text
    ) {
        super();
    }
    public override toDOM(): Text {
        return this.createMarker();
    }
}
interface GutterInfo {
    lineNr: number;
    on: boolean;
}
interface MyGutterConfig<Info extends GutterInfo> {
    name: string;
    onClick?: (info: Info) => void,
    extraExtensions?: Extension;
}
export abstract class Gutters<
    Info extends GutterInfo = GutterInfo,
    Config extends MyGutterConfig<Info> = MyGutterConfig<Info>,
    > {
    private config: Config;
    private effect: StateEffectType<Info>;
    private state: StateField<Map<number, Info>>;

    constructor(config: Config) {
        this.config = config;
        // this.markers = Facet.define<RangeSet<GutterMarker>>();
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

    protected abstract marker(info: Info): GutterMarker | null;

    public setMarker(view: EditorView, info: Info): void {
        view.dispatch({
            effects: this.effect.of(info)
        });
    }

    toExtension(): Extension {
        const handlers: any = {};
        if (this.config.onClick) {
            handlers["mousedown"] = (view: EditorView, line: BlockInfo) => {
                const markings = view.state.field(this.state);
                const lineNr = view.state.doc.lineAt(line.from).number;
                const markerInfo = markings.get(lineNr)!;
                // Line numbers start at 1
                this.config.onClick!(markerInfo);
                this.setMarker(view, markerInfo);
            };
        }
        return [
            this.state,
            gutter({
                class: `cm-${this.config.name}-gutter`,
                lineMarker: (view, line) => {
                    const gutters = view.state.field(this.state);
                    const lineNr = view.state.doc.lineAt(line.from).number;
                    if (gutters.has(lineNr)) {
                        return this.marker(gutters.get(lineNr)!);
                    } else {
                        return null;
                    }
                },
                lineMarkerChange: update => {
                    return update.startState.field(this.state) !== update.state.field(this.state);
                },
                initialSpacer: () => {
                    return this.marker({ lineNr: -1, on: true } as Info)!;
                },
                domEventHandlers: handlers
            }),
            this.config.extraExtensions || []
        ];
    }
}

export class BreakpointsGutter extends Gutters {
    constructor(onToggle: (info: GutterInfo) => void) {
        super({
            name: "breakpoint",
            onClick: onToggle,
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

    protected override marker(info: GutterInfo): GutterMarker | null {
        if (info.on) {
            return new SimpleMarker(() => document.createTextNode("🔴"));
        }
        return null;
    }
}

export interface UsedInputGutterInfo extends GutterInfo {
    title: string;
}
export class UsedInputGutters extends Gutters<UsedInputGutterInfo> {
    constructor() {
        super({
            name: "input"
        });
    }

    protected override marker(info: UsedInputGutterInfo): GutterMarker | null {
        if (info.on) {
            return new SimpleMarker(() => {
                const node = document.createElement("div");
                node.classList.add("_tw-text-lime-400");
                node.replaceChildren(document.createTextNode("✔"));
                node.setAttribute("title", info.title);
                return node as any as Text;
            });
        }
        return null;
    }
}
