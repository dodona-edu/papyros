import { expose } from "comlink";
import { Backend } from "../../Backend";
import { PapyrosEvent } from "../../PapyrosEvent";
import { INITIALIZATION_CODE } from "./init.py";

interface LoadPyodideArgs {
    indexURL: string;
    fullStdLib: boolean;
}
interface Pyodide {
    runPython: (code: string, globals?: any) => any;
    runPythonAsync: (code: string) => Promise<void>;
    loadPackagesFromImports: (code: string) => Promise<void>;
    globals: Map<string, any>;
    toPy: (obj: any) => any;
}
declare function importScripts(...urls: string[]): void;
declare function loadPyodide(args: LoadPyodideArgs): Promise<Pyodide>;

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
        const pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
            fullStdLib: false
        });
        this.pyodide = pyodide;
        await this.runCode(INITIALIZATION_CODE, 0);
        // Python calls our function with a dict, which must be converted to a PapyrosEvent
        const eventCallback = (data: Map<string, any>): void =>
            this.onEvent(Object.fromEntries(data) as PapyrosEvent);
        this.pyodide.globals.get("__override_builtins")(eventCallback);
        this.globals = new Map(this.pyodide.globals.get("__dodona_globals").toJs());
        const originalOnEvent = this.onEvent;
        this.onEvent = (e: PapyrosEvent) => {
            const jsEvent: PapyrosEvent = "toJs" in e ? (e as any).toJs() as PapyrosEvent : e;
            return originalOnEvent(jsEvent);
        };
        this.initialized = true;
    }

    override async _runCodeInternal(code: string): Promise<any> {
        await this.pyodide.loadPackagesFromImports(code);
        if (this.initialized) {
            // return this.pyodide.runPython(code, this.pyodide.toPy(new Map(this.globals)));
            return this.pyodide.runPython(code);
        } else {
            return this.pyodide.runPythonAsync(code);
        }
    }
}

expose(new PythonWorker());
