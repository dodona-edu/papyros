import { expose } from "comlink";
import { Backend } from "../../Backend";
import { PapyrosEvent } from "../../PapyrosEvent";
import { INITIALIZATION_CODE } from "./init.py";

interface LoadPyodideArgs {
    indexURL: string;
    fullStdLib: boolean;
}
interface Pyodide {
    runPythonAsync: (code: string) => Promise<void>;
    loadPackagesFromImports: (code: string) => Promise<void>;
    globals: Map<string, any>;
}
declare function importScripts(...urls: string[]): void;
declare function loadPyodide(args: LoadPyodideArgs): Promise<Pyodide>;

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
        const pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
            fullStdLib: true
        });
        this.pyodide = pyodide;
        await this.runCode(INITIALIZATION_CODE, "");
        // Python calls our function with a dict, which must be converted to a PapyrosEvent
        const eventCallback = (data: Map<string, any>): void =>
            this.onEvent(Object.fromEntries(data) as PapyrosEvent);
        this.pyodide.globals.get("__override_builtins")(eventCallback);
        this.initialized = true;
    }

    override async _runCodeInternal(code: string): Promise<any> {
        await this.pyodide.loadPackagesFromImports(code);
        if (this.initialized) {
            return this.pyodide.globals.get("__run_code")(code);
        } else {
            return this.pyodide.runPythonAsync(code);
        }
    }
}

expose(new PythonWorker());
