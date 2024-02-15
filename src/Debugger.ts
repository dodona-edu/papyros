import { Renderable, RenderOptions, renderWithOptions } from "./util/Rendering";
import { getElement, t } from "./util/Util";
import { TraceComponent } from "@dodona/trace-component";
import { BackendManager } from "./BackendManager";
import { BackendEventType } from "./BackendEvent";
import "@dodona/trace-component";
import { Frame } from "@dodona/trace-component/dist/trace_types";

const TRACE_COMPONENT_ID = "trace-component";
const EXECUTION_LIMIT = 10000;

export type FrameState = {
    line: number;
    outputs: number;
    inputs: number;
};

function createDelayer(): (callback: () => void, ms: number) => void {
    let timer: any;
    return (callback, ms) => {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
}
const delay = createDelayer();

export class Debugger extends Renderable<RenderOptions> {
    private frameStates: FrameState[] = [];
    private currentOutputs: number = 0;
    private currentInputs: number = 0;
    private traceComponent: TraceComponent | undefined;
    private traceBuffer: Frame[] = [];

    constructor() {
        super();
        this.reset();

        BackendManager.subscribe(BackendEventType.Start, () => {
            this.reset();
        });
        BackendManager.subscribe(BackendEventType.Output, () => {
            this.currentOutputs++;
        });
        BackendManager.subscribe(BackendEventType.Input, () => {
            this.currentInputs++;
        });
        BackendManager.subscribe(BackendEventType.Frame, e => {
            const frame = JSON.parse(e.data);
            const frameState = {
                line: frame.line,
                outputs: this.currentOutputs,
                inputs: this.currentInputs
            };
            this.frameStates.push(frameState);
            this.traceBuffer.push(frame);
            if (this.traceBuffer.length > 100) {
                this.clearBuffer();
            } else {
                delay(() => this.clearBuffer(), 100);
            }
            if (this.frameStates.length >= EXECUTION_LIMIT) {
                BackendManager.publish({
                    type: BackendEventType.Stop,
                    data: "Execution limit reached"
                });
            }
        });
    }

    protected override _render(options: RenderOptions): void {
        renderWithOptions(options, `
                    <tc-trace id="${TRACE_COMPONENT_ID}"></tc-trace>
        `);

        this.traceComponent = getElement(TRACE_COMPONENT_ID) as TraceComponent;
        this.traceComponent.translations = t("Papyros.debugger") as any;
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

    public clearBuffer(): void {
        for (const frame of this.traceBuffer) {
            this.traceComponent?.addFrame(frame);
        }
        this.traceBuffer = [];
    }
}
