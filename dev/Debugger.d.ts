import { Renderable, RenderOptions } from "./util/Rendering";
import "@dodona/trace-component";
export type FrameState = {
    line: number;
    outputs: number;
    inputs: number;
};
export declare class Debugger extends Renderable<RenderOptions> {
    private frameStates;
    private currentOutputs;
    private currentInputs;
    private traceComponent;
    private traceBuffer;
    constructor();
    protected _render(options: RenderOptions): void;
    reset(): void;
    clearBuffer(): void;
}
