import { PapyrosEvent } from "./PapyrosEvent";
import { Channel, readMessage, uuidv4 } from "sync-message";
import { parseEventData } from "./util/Util";
import { CompletionResult } from "@codemirror/autocomplete";

export interface WorkerAutocompleteContext {
    explicit: boolean;
    pos: number;
    text: string;
    before: {
        from: number;
        to: number;
        text: string;
    } | null;
}

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
        // Input messages are handled in a special way
        // In order to link input requests to their responses
        // An ID is required to make the connection
        // The message must be read in the worker to not stall the main thread
        const onInput = (e: PapyrosEvent): string => {
            const inputData = parseEventData(e);
            const messageId = uuidv4();
            inputData.messageId = messageId;
            e.data = JSON.stringify(inputData);
            e.contentType = "text/json";
            onEvent(e);
            return readMessage(channel, messageId);
        };
        this.onEvent = (e: PapyrosEvent) => {
            e.runId = this.runId;
            if (e.type === "input") {
                return onInput(e);
            } else {
                return onEvent(e);
            }
        };
        return Promise.resolve();
    }

    /**
     * Internal helper method that actually executes the code
     * Results or Errors must be passed by using the onEvent-callback
     * @param code The code to run
     */
    protected abstract _runCodeInternal(code: string): Promise<any>;

    /**
     * Executes the given code
     * @param {string} code The code to run
     * @param {string} runId The uuid for this execution
     * @return {Promise<void>} Promise of execution
     */
    async runCode(code: string, runId: number): Promise<any> {
        this.runId = runId;
        return await this._runCodeInternal(code);
    }

    /**
     * Generate autocompletion suggestions for the given context
     * @param {WorkerAutocompleteContext} context Context to autcomplete in
     */
    abstract autocomplete(context: WorkerAutocompleteContext): Promise<CompletionResult | null>;
}
