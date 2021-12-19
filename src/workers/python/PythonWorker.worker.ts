import { expose } from "comlink";
import { Backend } from "../../Backend";
import { PapyrosEvent } from "../../PapyrosEvent";
import { INITIALIZATION_CODE, INITIALIZE_PYTHON_BACKEND, PROCESS_PYTHON_CODE } from "./init.py";

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

    constructor() {
        super();
        this.pyodide = {} as Pyodide;
        this.initialized = false;
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
        this.pyodide.globals.get(INITIALIZE_PYTHON_BACKEND)(eventCallback);
        this.initialized = true;
    }

    override async _runCodeInternal(code: string): Promise<any> {
        if (this.initialized) {
            if (await this.pyodide.globals.get(PROCESS_PYTHON_CODE)(code, false)) {
                await this.pyodide.loadPackagesFromImports(code);
                await this.pyodide.globals.get(PROCESS_PYTHON_CODE)(code, true);
            }
        } else {
            await this.pyodide.loadPackagesFromImports(code);
            return this.pyodide.runPythonAsync(code);
        }
    }
}

expose(new PythonWorker());
