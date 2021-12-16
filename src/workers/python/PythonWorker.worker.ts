import { expose } from "comlink";
import { Backend } from "../../Backend";
import { PapyrosEvent } from "../../PapyrosEvent";
import { INITIALIZATION_CODE } from "./init.py";

interface Pyodide {
    runPython: (code: string, globals?: any) => any;
    runPythonAsync: (code: string) => Promise<void>;
    loadPackagesFromImports: (code: string) => Promise<void>;
    globals: Map<string, any>;
}
declare function importScripts(...urls: string[]): void;
declare function loadPyodide(args: { indexURL: string; fullStdLib: boolean }): Promise<Pyodide>;

importScripts("https://cdn.jsdelivr.net/pyodide/v0.18.1/full/pyodide.js");


class PythonWorker extends Backend {
    pyodide: Pyodide;
    initialized: boolean;
    globals: Map<string, any>;

    constructor() {
        super();
        this.pyodide = {} as Pyodide;
        this.initialized = false;
        this.globals = new Map();
    }

    override async launch(onEvent: (e: PapyrosEvent) => void,
        inputTextArray?: Uint8Array, inputMetaData?: Int32Array): Promise<void> {
        await super.launch(onEvent, inputTextArray, inputMetaData);
        this.pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
            fullStdLib: false
        });
        await this.runCode(INITIALIZATION_CODE, 0);
        // Python calls our function with a dict, which must be converted to a PapyrosEvent
        const eventCallback = (data: any): void => {
            const jsEvent: PapyrosEvent = "toJs" in data ? data.toJs() : Object.fromEntries(data);
            return this.onEvent(jsEvent);
        };
        this.pyodide.globals.get("__override_builtins")(eventCallback);
        this.globals = new Map((this.pyodide.globals as any).toJs());
        this.initialized = true;
    }

    _cleanScope(): void {
        // Find the newly added globals
        const pyodideGlobals = this.pyodide.globals;
        const keysToRemove: Array<string> = [];
        for (const key of pyodideGlobals.keys()) {
            if (!this.globals.has(key)) {
                keysToRemove.push(key);
            } else {
                // Reset value in case it was overriden
                pyodideGlobals.set(key, this.globals.get(key));
            }
        }
        // Remove them from the actual globals
        // Separate runs of code should not be able to access variables/functions
        // that were defined earlier on, as this could cause non-obvious bugs
        keysToRemove.forEach(k => pyodideGlobals.delete(k));
    }

    override async _runCodeInternal(code: string): Promise<any> {
        await this.pyodide.loadPackagesFromImports(code);
        if (this.initialized) {
            // run the code, potentially polluting the namespace
            // Functions and variables defined by the user become global
            // We need them to be global to let doctest work out of the box
            try {
                return await this.pyodide.globals.get("__run_code")(code);
            } finally {
                // Cleanup the scope after computations are done
                // Even in case of errors
                this._cleanScope();
            }
        } else {
            return this.pyodide.runPythonAsync(code);
        }
    }
}

expose(new PythonWorker());
