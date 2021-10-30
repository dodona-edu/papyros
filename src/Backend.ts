import { PapyrosEvent } from "./PapyrosEvent";

export interface Backend {
    /**
     * Initialize the backend, setting up any globals required
     */

    launch: () => Promise<void>;
    /**
     * Validate and run arbitrary code
     * @param {string} code The code to run
     * @return {Promise<any>} The (often useless) result of the code
     */
    runCode: (code: string, onData: (e: PapyrosEvent) => void) => Promise<any>;

    /**
     * Shutdown the backend and undo any global changes to declutter namespaces
     */
    shutdown: () => Promise<void>;

    terminateExecution: () => Promise<void>;

    send: (data: PapyrosEvent) => void;
};