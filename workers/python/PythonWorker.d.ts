import { Backend, RunMode, WorkerAutocompleteContext, WorkerDiagnostic } from "../../Backend";
import { CompletionResult } from "@codemirror/autocomplete";
import { BackendEvent } from "../../BackendEvent";
import { PyodideExtras } from "pyodide-worker-runner";
/**
 * Implementation of a Python backend for Papyros
 * Powered by Pyodide (https://pyodide.org/)
 */
export declare class PythonWorker extends Backend<PyodideExtras> {
    private pyodide;
    private papyros;
    /**
     * Promise to asynchronously install imports needed by the code
     */
    private installPromise;
    constructor();
    private static convert;
    /**
     * @return {any} Function to expose a method with Pyodide support
     */
    protected syncExpose(): any;
    private static getPyodide;
    launch(onEvent: (e: BackendEvent) => void, onOverflow: () => void): Promise<void>;
    /**
     * Helper method to install imports and prevent race conditions with double downloading
     * @param {string} code The code containing import statements
     */
    private installImports;
    runModes(code: string): Array<RunMode>;
    runCode(extras: PyodideExtras, code: string, mode?: string): Promise<any>;
    autocomplete(context: WorkerAutocompleteContext): Promise<CompletionResult | null>;
    lintCode(code: string): Promise<Array<WorkerDiagnostic>>;
}
