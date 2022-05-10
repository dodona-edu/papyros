import * as Comlink from "comlink";
import { Backend, WorkerAutocompleteContext, WorkerDiagnostic } from "../../Backend";
import { CompletionResult } from "@codemirror/autocomplete";
import { BackendEvent } from "../../BackendEvent";
import {
    pyodideExpose, Pyodide,
    loadPyodideAndPackage,
    PyodideExtras
} from "pyodide-worker-runner";
import { LogType, papyrosLog } from "../../util/Logging";
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

    public override async launch(
        onEvent: (e: BackendEvent) => void
    ): Promise<void> {
        await super.launch(onEvent);
        this.pyodide = await pyodidePromise;
        // Python calls our function with a PyProxy dict or a Js Map,
        // These must be converted to a PapyrosEvent (JS Object) to allow message passing
        this.papyros = (await Promise.all([
            this.pyodide.pyimport("papyros").Papyros.callKwargs(
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
            ),
            (this.pyodide as any).loadPackage("micropip")
        ]))[0];
    }

    /**
     * Helper method to install imports and prevent race conditions with double downloading
     * @param {string} code The code containing import statements
     * @param {boolean} ignoreMissing Whether to ignore failures on missing modules
     */
    private async installImports(code: string, ignoreMissing: boolean): Promise<void> {
        if (this.installPromise == null) {
            this.installPromise = this.papyros.install_imports.callKwargs({
                source_code: code,
                ignore_missing: ignoreMissing
            }).catch((e: any) => papyrosLog(LogType.Error, "Error during Python imports", e));
        }
        await this.installPromise;
        this.installPromise = null;
    }

    public override runModes(): string[] {
        return [...super.runModes(), "snoop"];
    }

    public async runCode(extras: PyodideExtras, code: string, mode: string): Promise<any> {
        this.extras = extras;
        if (extras.interruptBuffer) {
            this.pyodide.setInterruptBuffer(extras.interruptBuffer);
        }
        await this.installImports(code, true);
        return await this.papyros.run_async.callKwargs({
            source_code: code,
            mode: mode,
            // Suitable color picked from http://help.farbox.com/pygments.html
            snoop_config: { color: "default" }
        });
    }

    public override async autocomplete(context: WorkerAutocompleteContext):
        Promise<CompletionResult | null> {
        await this.installImports(context.text, true);
        const result: CompletionResult = PythonWorker.convert(
            this.papyros.autocomplete(context)
        );
        result.validFor = /^[\w$]*$/;
        return result;
    }

    public override async lintCode(code: string): Promise<Array<WorkerDiagnostic>> {
        await this.installImports(code, true);
        return PythonWorker.convert(this.papyros.lint(code));
    }
}

// Default export to be recognized as a TS module
export default {} as any;

// Comlink and Comsync handle the actual export
Comlink.expose(new PythonWorker());
