import { PapyrosEvent } from "./PapyrosEvent";
export declare abstract class Backend {
    onEvent: (e: PapyrosEvent) => any;
    runId: number;
    constructor();
    /**
     * Initialize the backend, setting up any globals required
     * @param {function(PapyrosEvent):void} onEvent Callback for when events occur
     * @param {Uint8Array} inputTextArray Optional shared buffer for input
     * @param {Int32Array} inputMetaData Optional shared buffer for metadata about input
     * @return {Promise<void>} Promise of launching
     */
    launch(onEvent: (e: PapyrosEvent) => void, inputTextArray?: Uint8Array, inputMetaData?: Int32Array): Promise<void>;
    abstract _runCodeInternal(code: string): Promise<any>;
    /**
     * Validate and run arbitrary code
     * @param {string} code The code to run
     * @param {string} runId The uuid for this execution
     * @return {Promise<void>} Promise of execution
     */
    runCode(code: string, runId: number): Promise<void>;
}
