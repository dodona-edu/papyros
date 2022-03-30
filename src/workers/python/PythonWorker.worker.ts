import { expose } from "comlink";
import { Backend, WorkerAutocompleteContext } from "../../Backend";
import { LogType, papyrosLog } from "../../util/Logging";
import { Pyodide, PYODIDE_INDEX_URL, PYODIDE_JS_URL } from "./Pyodide";
import { Channel } from "sync-message";
import { CompletionResult } from "@codemirror/autocomplete";
import { parseData } from "../../util/Util";
import { BackendEvent } from "../../BackendEvent";
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

    private convert(data: any): any {
        let converted = data;
        if ("toJs" in data) {
            converted = data.toJs();
        }
        return Object.fromEntries(converted);
    }

    override async launch(
        onEvent: (e: BackendEvent) => void,
        channel: Channel
    ): Promise<void> {
        await super.launch(onEvent, channel);
        this.pyodide = await loadPyodide({
            indexURL: PYODIDE_INDEX_URL,
            fullStdLib: false
        });
        // Load our own modules to connect Papyros and Pyodide
        await this.runCodeInternal(initPythonString);
        // Python calls our function with a PyProxy dict or a Js Map,
        // These must be converted to a PapyrosEvent (JS Object) to allow message passing
        const eventCallback = (data: any): void => {
            return this.onEvent(this.convert(data));
        };
        // Initialize our loaded Papyros module with the callback
        await this.pyodide.globals.get("init_papyros")(eventCallback);
        this.initialized = true;
    }

    override async runCodeInternal(code: string): Promise<any> {
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
        // Do not await as not strictly required to compute autocompletions
        this.pyodide.loadPackagesFromImports(context.text);
        const result = this.convert(await this.pyodide.globals.get("autocomplete")(context));
        result.options = parseData(result.options, result.contentType);
        delete result.contentType;
        result.span = /^[\w$]*$/;
        return result;
    }
}

// Default export to be recognized as a TS module
export default {} as any;
// Expose handles the actual export
expose(new PythonWorker());
