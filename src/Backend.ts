import { PapyrosEvent } from "./PapyrosEvent";

export interface Backend {
    /**
     * Initialize the backend, setting up any globals required
     * @return {Promise<Backend>} The initialized backend
     */

    launch: () => Promise<Backend>;
    /**
     * Validate and run arbitrary code
     * @param {string} code The code to run
     * @return {Promise<any>} The (often useless) result of the code
     */
    runCode: (code: string, input: string, onData: (e: any) => void) => Promise<any>;

    /**
     * Shutdown the backend and undo any global changes to declutter namespaces
     */
    shutdown: () => Promise<void>;

    terminateExecution: () => Promise<void>;

    send: (data: PapyrosEvent) => void;
};