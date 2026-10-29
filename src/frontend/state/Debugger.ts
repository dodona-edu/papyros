import { BackendEventType } from "../../communication/BackendEvent";
import { Frame } from "@dodona/trace-component/dist/trace_types";
import { State, stateProperty } from "@dodona/lit-state";
import { Papyros } from "./Papyros";
import { CODE_TAB, FileEntry, HOST_TAB, parseFileEntries } from "./InputOutput";
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
    /**
     * Whether debugging was ever started on this instance. Unlike the trace, it survives
     * a stop, so the debugger pane can say that the debugger stopped, even when the host
     * created its element anew.
     */
    @stateProperty
    public hasDebugged: boolean = false;

    public set active(active: boolean) {
        this._active = active;
        if (active) {
            this.hasDebugged = true;
        }

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
            // Only the run's own snapshots, not the one provideFiles sends from outside a run
            if (this._active && e.runId !== undefined) {
                this.fileHistory = [...this.fileHistory, parseFileEntries(e.data, e.contentType)];
            }
        });
        this.papyros.events.subscribe(BackendEventType.Frame, (e) => {
            if (!this.acceptsFrames()) {
                return;
            }
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
                void this.papyros.runner.stop();
            } else if (!this.papyros.runner.inProgress) {
                // frame delivery is not ordered with respect to the run's
                // end: stragglers arriving after the run must not wait for
                // the timer, the trace should be complete as soon as they land
                this.flushFrames();
            } else {
                this.flushTimer ??= setTimeout(() => this.flushFrames(), Debugger.FLUSH_INTERVAL_MS);
            }
        });
        for (const type of [BackendEventType.End, BackendEventType.Interrupt]) {
            this.papyros.events.subscribe(type, () => this.onRunOver());
        }
    }

    /**
     * Called by the Runner when a run begins
     */
    public onRunStart(): void {
        this.reset();
    }

    /**
     * Whether a frame received now belongs to the current run: not after the tracer's
     * uncaught_exception frame, which is always the last one it sends
     */
    private acceptsFrames(): boolean {
        return this.lastMaterializedFrame?.event !== "uncaught_exception";
    }

    /**
     * Called when a run stops producing frames: by the Runner on stop, and when the run is over
     */
    public onRunEnd(): void {
        this.flushFrames();
    }

    /**
     * Called when a run is over: through the bus when the worker reports its end, and
     * by the Runner when the run ends. A debug run without a
     * single step leaves nothing to step through, so it ends debug mode, and the code
     * bar, the debugger pane and the host all leave debug mode together.
     */
    public onRunOver(): void {
        this.onRunEnd();
        if (this._active && this.trace.length === 0) {
            this.active = false;
        }
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
        if (tab !== CODE_TAB && tab !== HOST_TAB && !this.debugFiles.some((f) => f.name === tab)) {
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
