import { BackendEventType } from "../../communication/BackendEvent";
import { Frame } from "@dodona/trace-component/dist/trace_types";
import { State, stateProperty } from "@dodona/lit-state";
import { Papyros } from "./Papyros";
import { CODE_TAB, FileEntry, parseFileEntries } from "./InputOutput";
import { materializeFrame } from "./DebuggerFrames";
export type FrameState = {
    line: number;
    outputs: number;
    inputs: number;
    files: number;
};

export class Debugger extends State {
    /**
     * Streamed frames are buffered and flushed to the reactive properties in
     * batches: one array reassignment per flush instead of one per frame.
     * Per-frame spreads are quadratic over a debug run and re-render the
     * trace component at frame rate. Flushing happens on a short timer while
     * frames stream in, and synchronously when the run ends, errors or is
     * interrupted, so a finished run is always fully visible.
     */
    private static readonly FLUSH_INTERVAL_MS = 50;

    private papyros: Papyros;
    private pendingFrames: Frame[] = [];
    private pendingFrameStates: FrameState[] = [];
    private lastMaterializedFrame: Frame | undefined = undefined;
    private flushTimer: ReturnType<typeof setTimeout> | undefined = undefined;
    private runActive: boolean = false;
    @stateProperty
    private frameStates: FrameState[] = [];
    @stateProperty
    private _activeFrame: number | undefined = undefined;

    public set activeFrame(value: number | undefined) {
        this._activeFrame = value;
        this.validateActiveTab();
    }

    @stateProperty
    public get activeFrame(): number | undefined {
        return this._activeFrame;
    }
    @stateProperty
    public trace: Frame[] = [];
    @stateProperty
    private _active: boolean = false;
    @stateProperty
    private fileHistory: FileEntry[][] = [];

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

        this.papyros.events.subscribe(BackendEventType.Files, (e) => {
            if (this._active) {
                this.fileHistory = [...this.fileHistory, parseFileEntries(e.data, e.contentType)];
            }
        });
        this.papyros.events.subscribe(BackendEventType.Frame, (e) => {
            this.activeFrame ??= 0;
            const frame = materializeFrame(this.lastMaterializedFrame, JSON.parse(e.data));
            this.lastMaterializedFrame = frame;
            this.pendingFrames.push(frame);
            this.pendingFrameStates.push({
                line: frame.line,
                outputs: this.papyros.io.output.length,
                inputs: this.papyros.io.inputs.length,
                files: this.fileHistory.length,
            });
            // the tracer stops itself at maxDebugFrames, so this only fires for
            // a tracer that streams past its step budget
            if (this.frameStates.length + this.pendingFrameStates.length > this.papyros.constants.maxDebugFrames) {
                this.flushFrames();
                this.papyros.runner.stop();
            } else if (!this.runActive) {
                // frame delivery is not ordered with respect to the run's
                // end: stragglers arriving after the run must not wait for
                // the timer, the trace should be complete as soon as they land
                this.flushFrames();
            } else {
                this.flushTimer ??= setTimeout(() => this.flushFrames(), Debugger.FLUSH_INTERVAL_MS);
            }
        });
        for (const type of [BackendEventType.End, BackendEventType.Error, BackendEventType.Interrupt]) {
            this.papyros.events.subscribe(type, () => this.onRunEnd());
        }
    }

    /**
     * Called by the Runner when a run begins
     */
    public onRunStart(): void {
        this.runActive = true;
        this.reset();
    }

    /**
     * Called when a run stops producing frames: directly by the Runner on stop or
     * failure, and through the bus when the worker reports the run over
     */
    public onRunEnd(): void {
        this.runActive = false;
        this.flushFrames();
    }

    private flushFrames(): void {
        if (this.flushTimer !== undefined) {
            clearTimeout(this.flushTimer);
            this.flushTimer = undefined;
        }
        if (this.pendingFrames.length === 0) {
            return;
        }
        this.trace = this.trace.concat(this.pendingFrames);
        this.frameStates = this.frameStates.concat(this.pendingFrameStates);
        this.pendingFrames = [];
        this.pendingFrameStates = [];
    }

    public reset(): void {
        if (this.flushTimer !== undefined) {
            clearTimeout(this.flushTimer);
            this.flushTimer = undefined;
        }
        this.pendingFrames = [];
        this.pendingFrameStates = [];
        this.lastMaterializedFrame = undefined;
        this.frameStates = [];
        this.currentOutputs = 0;
        this.currentInputs = 0;
        this._activeFrame = undefined;
        this.trace = [];
        this.fileHistory = [];
    }

    private validateActiveTab(): void {
        const tab = this.papyros.io.activeEditorTab;
        if (tab !== CODE_TAB && !this.debugFiles.some((f) => f.name === tab)) {
            this.papyros.io.activeEditorTab = CODE_TAB;
        }
    }

    get activeFrameState(): FrameState | undefined {
        if (this.activeFrame === undefined) {
            return undefined;
        }

        return this.frameStates[this.activeFrame];
    }

    get debugLine(): number | undefined {
        return this.activeFrameState?.line;
    }

    get debugOutputs(): number | undefined {
        return this.activeFrameState?.outputs;
    }

    get debugUsedInputs(): number | undefined {
        return this.activeFrameState?.inputs;
    }

    get debugFiles(): FileEntry[] {
        const idx = this.activeFrameState?.files;
        if (idx === undefined || idx === 0) {
            return [];
        }
        return this.fileHistory[idx - 1] ?? [];
    }
}
