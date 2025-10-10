import { State, stateProperty } from "@dodona/lit-state";
import { BackendManager } from "../../communication/BackendManager";
import { BackendEventType } from "../../communication/BackendEvent";
import { parseData } from "../../util/Util";
import { Papyros } from "./Papyros";
import { RunState } from "./Runner";

/**
 * Shape of Error objects that are easy to interpret
 */
export interface FriendlyError {
    /**
     * The name of the Error
     */
    name: string;
    /**
     * Traceback for where in the code the Error occurred
     */
    traceback?: string;
    /**
     * General information about this type of Error
     */
    info?: string;
    /**
     * Information about what went wrong in this case
     */
    what?: string;
    /**
     * Information about why this is wrong and how to fix it
     */
    why?: string;
    /**
     * Where specifically in the source code the Error occurred
     */
    where?: string;
}

export enum OutputType {
    stdout = "stdout",
    stderr = "stderr",
    img = "img",
}

export type OutputEntry = {
    type: OutputType;
    content: string | FriendlyError;
    contentType?: string;
}

export enum InputMode {
    batch = "batch",
    interactive = "interactive",
}

export class InputOutput extends State {
    private papyros: Papyros;
    @stateProperty
        inputs: string[] = [];
    @stateProperty
        output: OutputEntry[] = [];
    @stateProperty
        prompt: string = "";
    @stateProperty
        awaitingInput: boolean = false;
    @stateProperty
        inputMode: InputMode = InputMode.interactive;

    @stateProperty
    private _inputBuffer: string = "";
    @stateProperty
    get inputBuffer(): string {
        return this._inputBuffer;
    }
    set inputBuffer(value: string) {
        this._inputBuffer = value;
        if(this.nextBufferedLine !== undefined && this.inputMode === InputMode.batch && this.awaitingInput) {
            this.provideInput(this.nextBufferedLine);
        }
        if(!this.papyros.debugger.active && this.papyros.runner.state === RunState.Ready) {
            this.clearInputs();
        }
    }
    private get nextBufferedLine(): string | undefined {
        const bufferedLines = this.inputBuffer.split("\n").slice(0,-1);
        if (bufferedLines.length > this.inputs.length) {
            return bufferedLines[this.inputs.length];
        }
        return undefined;
    }

    constructor(papyros: Papyros) {
        super();
        this.papyros = papyros;
        this.reset();
        BackendManager.subscribe(BackendEventType.Start, () => this.reset());
        BackendManager.subscribe(BackendEventType.Output, e => {
            const data = parseData(e.data, e.contentType);
            if (e.contentType && e.contentType.startsWith("img")) {
                this.logImage(data, e.contentType);
            } else {
                this.logOutput(data);
            }
        });
        BackendManager.subscribe(BackendEventType.Error, e => {
            const data = parseData(e.data, e.contentType);
            this.logError(data);
        });
        BackendManager.subscribe(BackendEventType.Input, e => {
            if(this.nextBufferedLine !== undefined && this.inputMode === InputMode.batch) {
                this.provideInput(this.nextBufferedLine);
                return;
            }

            this.prompt = e.data || "";
            this.awaitingInput = true;
        });
        BackendManager.subscribe(BackendEventType.End, () => {
            this.awaitingInput = false;
        });
    }

    public logError(error: FriendlyError | string): void {
        this.output = [...this.output, { type: OutputType.stderr, content: error }];
    }

    public logImage(imageData: string, contentType: string = "img/png"): void {
        this.output = [...this.output, { type: OutputType.img, content: imageData, contentType }];
    }

    public logOutput(output: string): void {
        // lines have been merged to limit the number of events
        // we split them again here, to simplify overflow detection
        const lines = output.split("\n");
        if (lines.length > 1) {
            this.output = [...this.output,
                ...lines.slice(0, -1).map(line => ({ type: OutputType.stdout, content: line + "\n" })),
                { type: OutputType.stdout, content: lines[lines.length - 1] }
            ];
        } else {
            this.output = [...this.output, { type: OutputType.stdout, content: output }];
        }
    }

    public provideInput(input: string): void {
        this.inputs = [...this.inputs, input];
        this.papyros.runner.provideInput(input);
        this.prompt = "";
        this.awaitingInput = false;
    }

    public clearInputs(): void {
        this.inputs = [];
    }

    public reset(): void {
        this.inputs = [];
        this.output = [];
        this.prompt = "";
        this.awaitingInput = false;
    }
}
