import * as Comlink from "comlink";
import { Backend, WorkerAutocompleteContext } from "../../Backend";
import { LogType, papyrosLog } from "../../util/Logging";
import { Pyodide } from "./Pyodide";
import { CompletionResult } from "@codemirror/autocomplete";
import { BackendEvent } from "../../BackendEvent";
import { pyodideExpose, loadPyodideAndPackage } from "pyodide-worker-runner";
import { SyncExtras } from "comsync";
/* eslint-disable-next-line */
const packageUrl = require("url-loader!./python_package.tar.load_by_url").default;

export async function getPyodide(): Promise<Pyodide> {
    const pyodide = (await loadPyodideAndPackage({ url: packageUrl, format: "tar" })) as Pyodide;
    // pyodide.pyimport("papyros");
    return pyodide;
}
const pyodidePromise = getPyodide();

/**
 * Implementation of a Python backend for Papyros
 * Powered by Pyodide (https://pyodide.org/)
 */
class PythonWorker extends Backend {
    pyodide: Pyodide;
    papyros: any;
    constructor() {
        super();
        this.pyodide = {} as Pyodide;
    }

    private static convert(data: any): any {
        return data.toJs ? data.toJs({ dict_converter: Object.fromEntries }) : data;
    }

    /**
     * @return {any} Function to expose a method with Pyodide support
     */
    protected override syncExpose(): any {
        return (f: any) => pyodideExpose(pyodidePromise, f);
    }

    override async launch(
        onEvent: (e: BackendEvent) => void
    ): Promise<void> {
        await super.launch(onEvent);
        this.pyodide = await pyodidePromise;
        // Python calls our function with a PyProxy dict or a Js Map,
        // These must be converted to a PapyrosEvent (JS Object) to allow message passing
        this.papyros = await this.pyodide.pyimport("papyros").Papyros.callKwargs(
            {
                callback: (e: any) => {
                    const converted = PythonWorker.convert(e);
                    return this.onEvent(converted);
                }
            }
        );
    }

    async runCode(syncExtras: SyncExtras, code: string): Promise<any> {
        this.syncExtras = syncExtras;
        await this.papyros.run_async(code);
    }

    override async autocomplete(context: WorkerAutocompleteContext):
        Promise<CompletionResult | null> {
        const result = PythonWorker.convert(await this.papyros.autocomplete(context));
        result.span = /^[\w$]*$/;
        return result;
    }
}

// Default export to be recognized as a TS module
export default {} as any;

// Comlink and Comsync handle the actual export
Comlink.expose(new PythonWorker());
