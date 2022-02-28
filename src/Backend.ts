import { PapyrosEvent } from "./PapyrosEvent";
import { LogType, papyrosLog } from "./util/Logging";
import { Channel, readMessage, uuidv4 } from "sync-message";

export abstract class Backend {
    protected onEvent: (e: PapyrosEvent) => any;
    protected runId: number;

    /**
     *  Constructor is limited as it is meant to be used as a WebWorker
     *  These are then exposed via Comlink. Proper initialization occurs
     *  in the launch method when the worker is started
     */
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.onEvent = () => { };
        this.runId = 0;
    }

    /**
     * Initialize the backend by doing all setup-related work
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
            if (e.type === "input") {
                e.content = uuidv4();
            }
            onEvent(e);
            if (e.type === "input") {
                return readMessage(channel, e.content!);
            }
        };
        return Promise.resolve();
    }

    /**
     * Internal helper method that actually executes the code
     * This yields a result or an error, which is then processed in runCode
     * @param code The code to run
     */
    protected abstract _runCodeInternal(code: string): Promise<any>;

    /**
     * Executes the given code
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
