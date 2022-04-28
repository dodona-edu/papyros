import * as Comlink from "comlink";
import { Backend, WorkerAutocompleteContext, WorkerDiagnostic } from "../../Backend";
import { CompletionResult } from "@codemirror/autocomplete";
import { BackendEvent } from "../../BackendEvent";
import {
    pyodideExpose, Pyodide,
    loadPyodideAndPackage,
    PyodideExtras
} from "pyodide-worker-runner";
/* eslint-disable-next-line */
const pythonPackageUrl = require("!!url-loader!./python_package.tar.gz.load_by_url").default;

async function getPyodide(): Promise<Pyodide> {
    return await loadPyodideAndPackage({ url: pythonPackageUrl, format: ".tgz" });
}
const pyodidePromise = getPyodide();

/**
 * Implementation of a Python backend for Papyros
 * Powered by Pyodide (https://pyodide.org/)
 */
class PythonWorker extends Backend<PyodideExtras> {
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
        return pyodideExpose;
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

    async runCode(extras: PyodideExtras, code: string): Promise<any> {
        this.extras = extras;
        if (extras.interruptBuffer) {
            this.pyodide.setInterruptBuffer(extras.interruptBuffer);
        }
        await this.papyros.run_async.callKwargs({
            source_code: code,
        });
    }

    override async autocomplete(context: WorkerAutocompleteContext):
        Promise<CompletionResult | null> {
        const result = PythonWorker.convert(await this.papyros.autocomplete(context));
        result.span = /^[\w$]*$/;
        return result;
    }

    override async lintCode(code: string): Promise<Array<WorkerDiagnostic>> {
        return PythonWorker.convert(await this.papyros.lint(code));
    }
}

// Default export to be recognized as a TS module
export default {} as any;

// Comlink and Comsync handle the actual export
Comlink.expose(new PythonWorker());
