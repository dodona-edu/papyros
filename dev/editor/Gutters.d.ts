import { Extension } from "@codemirror/state";
import { GutterMarker } from "@codemirror/view";
import { EditorView } from "@codemirror/view";
interface GutterInfo {
    lineNr: number;
    on: boolean;
}
interface MyGutterConfig<Info extends GutterInfo> {
    name: string;
    onClick?: (info: Info) => void;
    extraExtensions?: Extension;
}
export declare abstract class Gutters<Info extends GutterInfo = GutterInfo, Config extends MyGutterConfig<Info> = MyGutterConfig<Info>> {
    private config;
    private effect;
    private state;
    constructor(config: Config);
    protected abstract marker(info: Info): GutterMarker | null;
    setMarker(view: EditorView, info: Info): void;
    toExtension(): Extension;
}
export declare class BreakpointsGutter extends Gutters {
    constructor(onToggle: (info: GutterInfo) => void);
    protected marker(info: GutterInfo): GutterMarker | null;
}
export interface UsedInputGutterInfo extends GutterInfo {
    title: string;
}
export declare class UsedInputGutters extends Gutters<UsedInputGutterInfo> {
    constructor();
    protected marker(info: UsedInputGutterInfo): GutterMarker | null;
}
export {};
