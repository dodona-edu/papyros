import {State, stateProperty} from "@dodona/lit-state";
import {FriendlyError} from "../OutputManager";
import {BackendManager} from "../BackendManager";
import {BackendEventType} from "../BackendEvent";
import {parseData} from "../util/Util";
import {Papyros} from "./Papyros";

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

export class InputOutput extends State {
    private papyros: Papyros;
    @stateProperty
    inputs: string[] = [];
    @stateProperty
    output: OutputEntry[] = [];
    @stateProperty
    prompt: string = "";

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
            this.prompt = e.data || "";
        });
    }

    public logError(error: FriendlyError | string) {
        this.output = [...this.output, {type: OutputType.stderr, content: error}];
    }

    public logImage(imageData: string, contentType: string = "img/png") {
        this.output = [...this.output, {type: OutputType.img, content: imageData, contentType}];
    }

    public logOutput(output: string) {
        this.output = [...this.output, {type: OutputType.stdout, content: output}];
    }

    public provideInput(input: string) {
        this.inputs = [...this.inputs, input];
        this.papyros.runner.provideInput(input);
    }

    public reset() {
        this.inputs = [];
        this.output = [];
        this.prompt = "";
    }
}
