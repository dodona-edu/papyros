import { PapyrosEvent } from "./PapyrosEvent";
import { LogType, papyrosLog } from "./util/Logging";
import { Channel, readMessage } from "sync-message";

export abstract class Backend {
    onEvent: (e: PapyrosEvent) => any;
    runId: number;

    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.onEvent = () => { };
        this.runId = 0;
    }

    /**
     * Initialize the backend, setting up any globals required
     * @param {function(PapyrosEvent):void} onEvent Callback for when events occur
     * @param {Channel} channel for communication with the main thread
     * @return {Promise<void>} Promise of launching
     */
    launch(
        onEvent: (e: PapyrosEvent) => void,
        channel: Channel
    ): Promise<void> {
        this.onEvent = (e: PapyrosEvent) => {
            e.runId = this.runId;
            onEvent(e);
            if (e.type === "input") {
                return readMessage(channel, e.content!);
            }
        };
        return Promise.resolve();
    }

    abstract _runCodeInternal(code: string): Promise<any>;

    /**
     * Validate and run arbitrary code
     * @param {string} code The code to run
     * @param {string} runId The uuid for this execution
     * @return {Promise<void>} Promise of execution
     */
    async runCode(code: string, runId: number): Promise<void> {
        this.runId = runId;
        papyrosLog(LogType.Debug, "Running code in worker: ", code);
        try {
            const data = await this._runCodeInternal(code);
            papyrosLog(LogType.Debug, "ran code: " + code + " and received: ", data);
            return this.onEvent({ type: "success", data: JSON.stringify(data), runId: runId });
        } catch (error: any) {
            const errorString =
                typeof (error) !== "string" && "toString" in error ?
                    error.toString() :
                    JSON.stringify(error);
            papyrosLog(LogType.Error, "Error during execution: ", error, errorString);
            return this.onEvent({ type: "error", data: errorString, runId: runId });
        }
    }
}
