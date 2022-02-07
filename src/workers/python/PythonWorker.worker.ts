import { expose } from "comlink";
import { Backend } from "../../Backend";
import { PapyrosEvent } from "../../PapyrosEvent";
import { LogType, papyrosLog } from "../../util/Logging";
/* eslint-disable-next-line */
const initPythonString = require("!!raw-loader!./init.py").default;

interface Pyodide {
    runPython: (code: string, globals?: any) => any;
    runPythonAsync: (code: string) => Promise<void>;
    loadPackagesFromImports: (code: string) => Promise<void>;
    loadPackage: (names: string | string[]) => Promise<void>;
    globals: Map<string, any>;
}
// Worker specific import
declare function importScripts(...urls: string[]): void;
// Load in the Pyodide initialization script
importScripts("https://cdn.jsdelivr.net/pyodide/v0.18.1/full/pyodide.js");
// Now loadPyodide is available
declare function loadPyodide(args: { indexURL: string; fullStdLib: boolean }): Promise<Pyodide>;


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
        await this.runCode(initPythonString, 0);
        // Python calls our function with a dict, which must be converted to a PapyrosEvent
        const eventCallback = (data: any): void => {
            const jsEvent: PapyrosEvent = "toJs" in data ? data.toJs() : Object.fromEntries(data);
            return this.onEvent(jsEvent);
        };
        this.pyodide.globals.get("init_papyros")(eventCallback);
        this.initialized = true;
    }

    override async _runCodeInternal(code: string): Promise<any> {
        if (this.initialized) {
            try {
                await this.pyodide.loadPackagesFromImports(code);
            } catch (e) {
                papyrosLog(LogType.Debug, "Something went wrong while loading imports: ", e);
            }
            await this.pyodide.globals.get("process_code")(code);
        } else {
            // Don't use loadPackagesFromImports here because it loads matplotlib immediately
            await this.pyodide.loadPackage("micropip");
            return this.pyodide.runPythonAsync(code);
        }
    }
}

expose(new PythonWorker());
// Default export to be recognized as a TS module
export default null as any;
