import * as Comlink from "comlink";
import { Backend, WorkerAutocompleteContext } from "../../Backend";
import { LogType, papyrosLog } from "../../util/Logging";
import { Pyodide, PYODIDE_INDEX_URL, PYODIDE_JS_URL } from "./Pyodide";
import { CompletionResult } from "@codemirror/autocomplete";
import { parseData } from "../../util/Util";
import { BackendEvent } from "../../BackendEvent";
import { initPyodide, pyodideExpose } from "pyodide-worker-runner";
import { SyncExtras } from "comsync";
/* eslint-disable-next-line */
const initPythonString = require("!!raw-loader!./init.py").default;

// Load in the Pyodide initialization script
importScripts(PYODIDE_JS_URL);
// Now loadPyodide is available
declare function loadPyodide(args: { indexURL: string; fullStdLib: boolean }): Promise<Pyodide>;

let pyodidePromise: Pyodide | Promise<Pyodide> | null = null;
export async function getPyodide(): Promise<Pyodide> {
    if (pyodidePromise === null) {
        pyodidePromise = loadPyodide({
            indexURL: PYODIDE_INDEX_URL,
            fullStdLib: false
        });
    }
    pyodidePromise = await pyodidePromise;
    return Promise.resolve(pyodidePromise);
}

/**
 * Implementation of a Python backend for Papyros
 * Powered by Pyodide (https://pyodide.org/)
 */
class PythonWorker extends Backend {
    pyodide: Pyodide;

    constructor() {
        super();
        this.pyodide = {} as Pyodide;
    }

    private convert(data: any): any {
        let converted = data;
        if (data.toJs) {
            converted = data.toJs({ dict_converter: Object.fromEntries });
        }
        if (converted instanceof Map) {
            converted = Object.fromEntries(converted);
        }
        return converted;
    }

    /**
     * @return {any} Function to expose a method with Pyodide support
     */
    protected override syncExpose(): any {
        return (f: any) => pyodideExpose(getPyodide(), f);
    }

    override async launch(
        onEvent: (e: BackendEvent) => void
    ): Promise<void> {
        await super.launch(onEvent);
        this.pyodide = await getPyodide();
        initPyodide(this.pyodide);
        await this.pyodide.loadPackage("micropip");
        await this.pyodide.runPythonAsync(initPythonString);
        // Python calls our function with a PyProxy dict or a Js Map,
        // These must be converted to a PapyrosEvent (JS Object) to allow message passing
        // Initialize our loaded Papyros module with the callback
        await this.pyodide.globals.get("init_papyros")((e: any) => this.onEvent(this.convert(e)));
    }

    async runCode(syncExtras: SyncExtras, code: string): Promise<any> {
        this.syncExtras = syncExtras;
        try {
            // Sometimes a SyntaxError can cause imports to fail
            // We want the SyntaxError to be handled by process_code as well
            await this.pyodide.loadPackagesFromImports(code);
        } catch (e) {
            papyrosLog(LogType.Debug, "Something went wrong while loading imports: ", e);
        }
        await this.pyodide.globals.get("process_code")(code);
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

// Comlink and Comsync handle the actual export
Comlink.expose(new PythonWorker());
