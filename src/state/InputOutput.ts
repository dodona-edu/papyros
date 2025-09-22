import {State, stateProperty} from "@dodona/lit-state";
import {InputMode} from "./Papyros";
import {FriendlyError} from "../OutputManager";

export class InputOutput extends State {
    @stateProperty
    inputMode: InputMode = InputMode.batch;
    @stateProperty
    stdin: string = "";
    @stateProperty
    stdout: string = "";
    @stateProperty
    prompt: string = "";
    @stateProperty
    stderr: (string | FriendlyError)[] = [];

    public logError(error: FriendlyError | string) {
        // TODO
        this.stderr = [...this.stderr, error];
    }
}
