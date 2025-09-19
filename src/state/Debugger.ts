import { BackendManager } from "../BackendManager";
import { BackendEventType } from "../BackendEvent";
import { Frame } from "@dodona/trace-component/dist/trace_types";
import {State, stateProperty} from "@dodona/lit-state";

const EXECUTION_LIMIT = 10000;

export type FrameState = {
    line: number;
    outputs: number;
    inputs: number;
};

export class Debugger extends State {
    @stateProperty
    private frameStates: FrameState[] = [];
    @stateProperty
    private currentOutputs: number = 0;
    @stateProperty
    private currentInputs: number = 0;
    @stateProperty
    public activeFrame: number | undefined = undefined;
    @stateProperty
    public trace: Frame[] = [];
    @stateProperty
    public active: boolean = false;

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
            this.trace.push(frame);
            if (this.frameStates.length >= EXECUTION_LIMIT) {
                BackendManager.publish({
                    type: BackendEventType.Stop,
                    data: "Execution limit reached"
                });
            }
        });
    }

    public reset(): void {
        this.frameStates = [];
        this.currentOutputs = 0;
        this.currentInputs = 0;
        this.traceComponent.trace = [];
    }

    get activeFrameState(): FrameState | undefined {
        if(this.activeFrame === undefined) {
            return undefined;
        }

        return this.frameStates[this.activeFrame];
    }

    get debugLine(): number | undefined {
        return this.activeFrameState?.line;
    }

    get debugOutputs(): number | undefined {
        return this.activeFrameState?.outputs
    }

    get debugInputs(): number | undefined {
        return this.activeFrameState?.inputs
    }
}
