import * as Comlink from "comlink";
import { Backend, RunMode, WorkerAutocompleteContext, WorkerDiagnostic } from "../../Backend";
import { CompletionResult } from "@codemirror/autocomplete";
import { BackendEvent } from "../../BackendEvent";
import {
    pyodideExpose, Pyodide,
    loadPyodideAndPackage,
    PyodideExtras
} from "pyodide-worker-runner";
/* eslint-disable-next-line */
const pythonPackageUrl = require("!!url-loader!./python_package.tar.gz.load_by_url").default;

/**
 * Implementation of a Python backend for Papyros
 * Powered by Pyodide (https://pyodide.org/)
 */
class PythonWorker extends Backend<PyodideExtras> {
    private pyodide: Pyodide;
    private papyros: any;
    /**
     * Promise to asynchronously install imports needed by the code
     */
    private installPromise: Promise<void> | null;
    constructor() {
        super();
        this.pyodide = {} as Pyodide;
        this.installPromise = null;
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

    private static async getPyodide(): Promise<Pyodide> {
        return await loadPyodideAndPackage({ url: pythonPackageUrl, format: ".tgz" });
    }

    public async launch(
        onEvent: (e: BackendEvent) => void,
        onOverflow: () => void
    ): Promise<void> {
        await super.launch(onEvent, onOverflow);
        this.pyodide = await PythonWorker.getPyodide();
        // Python calls our function with a PyProxy dict or a Js Map,
        // These must be converted to a PapyrosEvent (JS Object) to allow message passing
        this.papyros = this.pyodide.pyimport("papyros").Papyros.callKwargs(
            {
                callback: (e: any) => {
                    const converted = PythonWorker.convert(e);
                    return this.onEvent(converted);
                },
                buffer_constructor: (cb: (e: BackendEvent) => void) => {
                    this.queue.setCallback(cb);
                    return this.queue;
                }
            }
        );
        // preload micropip to allow installing packages
        await (this.pyodide as any).loadPackage("micropip");
    }

    /**
     * Helper method to install imports and prevent race conditions with double downloading
     * @param {string} code The code containing import statements
     */
    private async installImports(code: string): Promise<void> {
        if (this.installPromise == null) {
            this.installPromise = this.papyros.install_imports.callKwargs(
                {
                    source_code: code,
                    ignore_missing: true
                });
        }
        await this.installPromise;
        this.installPromise = null;
    }

    public override runModes(code: string): Array<RunMode> {
        const modes = super.runModes(code);
        modes.push({
            mode: "doctest",
            active: this.papyros.has_doctests(code)
        });
        return modes;
    }

    public override async runCode(extras: PyodideExtras, code: string, mode = "exec"):
        Promise<any> {
        this.extras = extras;
        if (extras.interruptBuffer) {
            this.pyodide.setInterruptBuffer(extras.interruptBuffer);
        }
        await this.installImports(code);
        return await this.papyros.run_async.callKwargs({
            source_code: code,
            mode: mode
        });
    }

    public override async generateTrace(code: string, mode?: string): Promise<string> {
        return "Not implemented";
    }

    public override async autocomplete(context: WorkerAutocompleteContext):
        Promise<CompletionResult | null> {
        await this.installImports(context.text);
        const result: CompletionResult = PythonWorker.convert(
            this.papyros.autocomplete(context)
        );
        result.validFor = /^[\w$]*$/;
        return result;
    }

    public override async lintCode(code: string): Promise<Array<WorkerDiagnostic>> {
        await this.installImports(code);
        return PythonWorker.convert(this.papyros.lint(code));
    }
}

// Default export to be recognized as a TS module
export default {} as any;

// Comlink and Comsync handle the actual export
Comlink.expose(new PythonWorker());
