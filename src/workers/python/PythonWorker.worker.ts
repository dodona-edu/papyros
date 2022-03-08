import { expose } from "comlink";
import { Backend, WorkerAutocompleteContext } from "../../Backend";
import { PapyrosEvent } from "../../PapyrosEvent";
import { LogType, papyrosLog } from "../../util/Logging";
import { Pyodide, PYODIDE_INDEX_URL, PYODIDE_JS_URL } from "./Pyodide";
import { Channel } from "sync-message";
import { CompletionResult } from "@codemirror/autocomplete";
/* eslint-disable-next-line */
const initPythonString = require("!!raw-loader!./init.py").default;

// Load in the Pyodide initialization script
importScripts(PYODIDE_JS_URL);
// Now loadPyodide is available
declare function loadPyodide(args: { indexURL: string; fullStdLib: boolean }): Promise<Pyodide>;

/**
 * Implementation of a Python backend for Papyros
 * Powered by Pyodide (https://pyodide.org/)
 */
class PythonWorker extends Backend {
    pyodide: Pyodide;
    initialized: boolean;

    constructor() {
        super();
        this.pyodide = {} as Pyodide;
        this.initialized = false;
    }

    override async launch(
        onEvent: (e: PapyrosEvent) => void,
        channel: Channel
    ): Promise<void> {
        await super.launch(onEvent, channel);
        this.pyodide = await loadPyodide({
            indexURL: PYODIDE_INDEX_URL,
            fullStdLib: false
        });
        // Load our own modules to connect Papyros and Pyodide
        await this._runCodeInternal(initPythonString);
        // Python calls our function with a PyProxy dict or a Js Map,
        // These must be converted to a PapyrosEvent (JS Object) to allow message passing
        const eventCallback = (data: any): void => {
            const jsEvent: PapyrosEvent = "toJs" in data ? data.toJs() : Object.fromEntries(data);
            return this.onEvent(jsEvent);
        };
        // Initialize our loaded Papyros module with the callback
        this.pyodide.globals.get("init_papyros")(eventCallback);
        this.initialized = true;
    }

    override async _runCodeInternal(code: string): Promise<any> {
        if (this.initialized) {
            try {
                // Sometimes a SyntaxError can cause imports to fail
                // We want the SyntaxError to be handled by process_code as well
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

    override async autocomplete(context: WorkerAutocompleteContext):
        Promise<CompletionResult | null> {
        return Promise.resolve(null);
    }
}

// Default export to be recognized as a TS module
export default {} as any;
// Expose handles the actual export
expose(new PythonWorker());
