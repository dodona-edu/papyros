import { BackendManager } from "../../communication/BackendManager";
import { BackendEventType } from "../../communication/BackendEvent";
import { Frame } from "@dodona/trace-component/dist/trace_types";
import { State, stateProperty } from "@dodona/lit-state";
import { Papyros } from "./Papyros";
export type FrameState = {
    line: number;
    outputs: number;
    inputs: number;
};

export class Debugger extends State {
    private papyros: Papyros;
    @stateProperty
    private frameStates: FrameState[] = [];
    @stateProperty
    public activeFrame: number | undefined = undefined;
    @stateProperty
    public trace: Frame[] = [];
    @stateProperty
    private _active: boolean = false;

    public set active(active: boolean) {
        this._active = active;

        this.reset();
    }

    @stateProperty
    public get active(): boolean {
        return this._active;
    }

    constructor(papyros: Papyros) {
        super();
        this.papyros = papyros;
        this.reset();

        BackendManager.subscribe(BackendEventType.Start, () => {
            this.reset();
        });
        BackendManager.subscribe(BackendEventType.Frame, e => {
            this.activeFrame ??= 0
            const frame = JSON.parse(e.data);
            const frameState = {
                line: frame.line,
                outputs: this.papyros.io.output.length,
                inputs: this.papyros.io.inputs.length
            };
            this.frameStates = [...this.frameStates, frameState];
            this.trace = [...this.trace, frame];
            if (this.frameStates.length >= this.papyros.constants.maxDebugFrames) {
                this.papyros.runner.stop();
            }
        });
    }

    public reset(): void {
        this.frameStates = [];
        this.currentOutputs = 0;
        this.currentInputs = 0;
        this.activeFrame = undefined;
        this.trace = [];
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

    get debugUsedInputs(): number | undefined {
        return this.activeFrameState?.inputs
    }
}
