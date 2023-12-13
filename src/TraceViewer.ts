import {Renderable, RenderOptions, renderWithOptions} from "./util/Rendering";
import {getElement} from "./util/Util";
import {TraceComponent} from "@dodona/trace-component";
import {BackendManager} from "./BackendManager";
import {BackendEventType} from "./BackendEvent";
import "@dodona/trace-component";

const TRACE_COMPONENT_ID = "trace-component";

export type FrameState = {
    line: number;
    outputs: number;
    inputs: number;
};

export class TraceViewer extends Renderable<RenderOptions> {
    private frameStates: FrameState[] = [];
    private currentOutputs: number = 0;
    private currentInputs: number = 0;
    private traceComponent: TraceComponent | undefined;

    constructor() {
        super();
        this.reset();

        BackendManager.subscribe(BackendEventType.Start, () => this.reset());
        BackendManager.subscribe(BackendEventType.Output, () => {
            this.currentOutputs++;
        });
        BackendManager.subscribe(BackendEventType.Input, () => {
            this.currentInputs++;
        });
        BackendManager.subscribe(BackendEventType.Frame, e => {
            const frame = JSON.parse(e.data);
            this.frameStates.push({
                line: frame.line,
                outputs: this.currentOutputs,
                inputs: this.currentInputs
            });
            this.traceComponent?.addFrame(frame);
        });
    }

    protected override _render(options: RenderOptions): void {
        renderWithOptions(options, `
                    <tc-trace id="${TRACE_COMPONENT_ID}"></tc-trace>
        `);

        this.traceComponent = getElement(TRACE_COMPONENT_ID) as TraceComponent;
        this.traceComponent.addEventListener("frame-change", e => {
            const frame = (e as CustomEvent).detail.frame;
            BackendManager.publish({
                type: BackendEventType.FrameChange,
                data: this.frameStates[frame]
            });
        });
    }

    public reset(): void {
        this.frameStates = [];
        this.currentOutputs = 0;
        this.currentInputs = 0;
        if (this.traceComponent) {
            this.traceComponent.trace = [];
        }
    }
}
