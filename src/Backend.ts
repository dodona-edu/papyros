import { PapyrosEvent } from "./PapyrosEvent";

export interface Backend {
    /**
     * Initialize the backend, setting up any globals required
     * @param {(e: PapyrosEvent) => void} onData Callback for when events occur
     */

    launch: (onData: (e: PapyrosEvent) => void, inputTextArray?: Uint8Array, inputSignal?: Int32Array) => Promise<void>;
    /**
     * Validate and run arbitrary code
     * @param {string} code The code to run
     * @return {Promise<any>} The (often useless) result of the code
     */
    runCode: (code: string) => Promise<any>;

    send: (data: PapyrosEvent) => void;
};