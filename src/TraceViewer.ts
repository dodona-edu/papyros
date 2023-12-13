import {Renderable, RenderOptions, renderWithOptions} from "./util/Rendering";
import {getElement} from "./util/Util";
import {TraceComponent} from "@dodona/trace-component";
import {BackendManager} from "./BackendManager";
import {BackendEventType} from "./BackendEvent";
import "@dodona/trace-component";
import {Trace} from "@dodona/trace-component/dist/trace_types";

const TRACE_COMPONENT_ID = "trace-component";

export class TraceViewer extends Renderable<RenderOptions> {
    private frameLine: number[] = [];
    private frameOutputs: number[] = [];
    private frameInputs: number[] = [];
    private currentOutputs: number = 0;
    private currentInputs: number = 0;

    constructor() {
        super();
    }

    protected override _render(options: RenderOptions): void {
        renderWithOptions(options, `
                    <tc-trace id="${TRACE_COMPONENT_ID}"></tc-trace>
        `);

        const traceComponent = getElement(TRACE_COMPONENT_ID) as TraceComponent;
        BackendManager.subscribe(BackendEventType.Frame, e => {
            const frame = JSON.parse(e.data);
            this.frameLine.push(frame.line);
            this.frameOutputs.push(this.currentOutputs);
            this.frameInputs.push(this.currentInputs);
            traceComponent.addFrame(frame);
        });
        BackendManager.subscribe(BackendEventType.Start, () => {
            this.frameLine = [];
            this.frameOutputs = [];
            this.frameInputs = [];
            this.currentOutputs = 0;
            this.currentInputs = 0;
            traceComponent.trace = [];
        });
        BackendManager.subscribe(BackendEventType.Output, () => {
            this.currentOutputs++;
        });
        BackendManager.subscribe(BackendEventType.Input, () => {
            this.currentInputs++;
        });

        traceComponent.addEventListener("frame-change", e => {
            const frame = (e as CustomEvent).detail.frame;
            BackendManager.publish({
                type: BackendEventType.FrameChange,
                data: {
                    line: this.frameLine[frame],
                    outputs: this.frameOutputs[frame],
                    inputs: this.frameInputs[frame]
                }
            });
        });
    }
}
