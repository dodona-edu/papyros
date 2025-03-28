import { Backend, RunMode, WorkerDiagnostic } from "../../Backend";
import { BackendEvent } from "../../BackendEvent";
import { PyodideInterface } from "pyodide";
import { PyProxy } from "pyodide/ffi";
import { pyodideExpose, PyodideExtras, loadPyodideAndPackage } from "pyodide-worker-runner";

/* eslint-disable-next-line */
const pythonPackageUrl = require("./python_package.tar.gz.load_by_url").default;

/**
 * Implementation of a Python backend for Papyros
 * Powered by Pyodide (https://pyodide.org/)
 */
export class PythonWorker extends Backend<PyodideExtras> {
    private pyodide: PyodideInterface;
    private papyros: PyProxy;
    /**
     * Promise to asynchronously install imports needed by the code
     */
    private installPromise: Promise<void> | null;
    constructor() {
        super();
        this.pyodide = {} as PyodideInterface;
        this.papyros = {} as PyProxy;
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

    private static async getPyodide(): Promise<PyodideInterface> {
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
        let modes = super.runModes(code);
        if (this.papyros.has_doctests(code)) {
            modes = [RunMode.Doctest, ...modes];
        }
        modes = [RunMode.Debug, ...modes];
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

    public override async lintCode(code: string): Promise<Array<WorkerDiagnostic>> {
        await this.installImports(code);
        return PythonWorker.convert(this.papyros.lint(code));
    }

    public override async provideFiles(inlineFiles: Record<string, string>, hrefFiles: Record<string, string>): Promise<void> {
        await this.papyros.provide_files.callKwargs({
            inline_files: JSON.stringify(inlineFiles),
            href_files: JSON.stringify(hrefFiles)
        });
    }
}

