import { Backend, Linter, RunMode, WorkerDiagnostic } from "../../Backend";
import { BackendEvent } from "../../../communication/BackendEvent";
import { loadPyodide, PyodideInterface } from "pyodide";
import { PyProxy } from "pyodide/ffi";
import { loadPyodideAndPackage } from "../../../sync/pyodide";
import { SyncExtras } from "../../../sync/expose";
import initRuff, { PositionEncoding, Workspace } from "@astral-sh/ruff-wasm-web";
import { RUFF_OPTIONS, toWorkerDiagnostics } from "./ruff";

const pythonPackageUrl = new URL("./python_package.tar.gz.load_by_url", import.meta.url).href;

export interface LintTimings {
    /**
     * The last lint, split into installing the code's imports and the linter itself
     */
    last: { linter: Linter; install: number; lint: number } | null;
    /**
     * Milliseconds after the worker started at which ruff could lint
     */
    ruffReady: number | null;
    /**
     * Milliseconds after the worker started at which Pyodide and micropip were loaded
     */
    pyodideReady: number | null;
}

/**
 * Implementation of a Python backend for Papyros
 * Powered by Pyodide (https://pyodide.org/)
 */
export class PythonWorker extends Backend {
    private pyodide: PyodideInterface;
    private papyros: PyProxy | undefined;
    /**
     * Promise to asynchronously install imports needed by the code
     */
    private installPromise: Promise<void> | null;
    /**
     * The ruff workspace, loading from launch() on. It boots next to Pyodide, so a
     * ruff lint can answer before the interpreter is up.
     */
    private ruff: Promise<Workspace> | null;
    /**
     * How long the last lint spent installing imports and linting, in milliseconds,
     * and when each linter became ready, in milliseconds since the worker started
     */
    private lintTimings: LintTimings;
    constructor() {
        super();
        this.pyodide = {} as PyodideInterface;
        this.installPromise = null;
        this.ruff = null;
        this.lintTimings = { last: null, ruffReady: null, pyodideReady: null };
    }

    private static convert(data: any): any {
        return data.toJs ? data.toJs({ dict_converter: Object.fromEntries }) : data;
    }

    private static async getPyodide(indexURL: string | undefined): Promise<PyodideInterface> {
        if (indexURL === undefined) {
            return await loadPyodideAndPackage({ url: pythonPackageUrl, format: ".tgz" });
        }
        return await loadPyodideAndPackage({ url: pythonPackageUrl, format: ".tgz" }, () => loadPyodide({ indexURL }));
    }

    public async launch(
        onEvent: (e: BackendEvent) => void,
        pyodideAssetURL: string | undefined,
        allowJspi: boolean = true,
    ): Promise<void> {
        await super.launch(onEvent, pyodideAssetURL, allowJspi);
        this.ruff = PythonWorker.loadRuff();
        this.ruff.then(() => (this.lintTimings.ruffReady = performance.now()));
        this.pyodide = await PythonWorker.getPyodide(pyodideAssetURL);
        // Python calls our function with a PyProxy dict or a Js Map,
        // These must be converted to a PapyrosEvent (JS Object) to allow message passing
        this.papyros = this.pyodide.pyimport("papyros").Papyros.callKwargs({
            callback: (e: any) => {
                const converted = PythonWorker.convert(e);
                return this.onEvent(converted);
            },
            buffer_constructor: (cb: (e: BackendEvent) => void) => {
                this.queue.setCallback(cb);
                return this.queue;
            },
        });
        // preload micropip to allow installing packages
        await (this.pyodide as any).loadPackage("micropip");
        this.lintTimings.pyodideReady = performance.now();
        this.jspi = allowJspi && (await PythonWorker.detectJspi(this.pyodide));
    }

    /**
     * Fetch the ruff wasm module and configure a workspace with papyros' rule set.
     * The module is resolved next to ruff's own script, so a bundler that emits the
     * worker must emit the wasm alongside it.
     * @return {Promise<Workspace>} The workspace once ruff is instantiated
     */
    private static async loadRuff(): Promise<Workspace> {
        await initRuff();
        return new Workspace(RUFF_OPTIONS, PositionEncoding.Utf16);
    }

    /**
     * Whether Pyodide can suspend the wasm stack here, so input() can await a promise
     * instead of blocking on the channel.
     *
     * can_run_sync() is asked from inside an async def entered through a plain PyProxy
     * call, which is exactly how run_async is invoked. That covers browser support,
     * Pyodide build support and the calling convention in one go, and it fails closed:
     * anything unexpected leaves the channel transport in place.
     * @param {PyodideInterface} pyodide The loaded interpreter
     * @return {Promise<boolean>} Whether stack switching is available
     */
    private static async detectJspi(pyodide: PyodideInterface): Promise<boolean> {
        const probe = pyodide.runPython(
            [
                "async def __papyros_jspi_probe():",
                "    from pyodide.ffi import can_run_sync",
                "    return can_run_sync()",
                "__papyros_jspi_probe",
            ].join("\n"),
        );
        try {
            return (await probe()) === true;
        } catch {
            return false;
        } finally {
            probe.destroy();
        }
    }

    /**
     * Helper method to install imports and prevent race conditions with double downloading.
     * Installs are serialized (chained) so concurrent calls don't download the same
     * package twice, but every call still installs the imports for ITS OWN code.
     * A single shared promise must not be reused across calls: otherwise a call could
     * ride on an install started for different code (e.g. the editor's empty initial
     * buffer while it is still linting the real code), leaving its own imports
     * uninstalled and producing a spurious "unable to import X" lint error.
     * @param {string} code The code containing import statements
     */
    private async installImports(code: string): Promise<void> {
        const install = (): Promise<void> | undefined =>
            this.papyros?.install_imports.callKwargs({
                source_code: code,
                ignore_missing: true,
            });
        // Chain onto any in-flight install (ignoring its outcome) so this call's
        // imports are installed after it, without concurrent double-downloads.
        this.installPromise = (this.installPromise ?? Promise.resolve()).then(install, install);
        await this.installPromise;
    }

    public override runModes(code: string): Array<RunMode> {
        let modes = super.runModes(code);
        if (this.papyros?.has_doctests(code)) {
            modes = [RunMode.Doctest, ...modes];
        }
        modes = [RunMode.Debug, ...modes];
        return modes;
    }

    public override async runCode(extras: SyncExtras, code: string, mode = "exec", maxSteps?: number): Promise<any> {
        this.extras = extras;
        if (extras.interruptBuffer) {
            this.pyodide.setInterruptBuffer(extras.interruptBuffer);
        }
        await this.installImports(code);
        return await this.papyros?.run_async.callKwargs({
            source_code: code,
            mode: mode,
            max_steps: maxSteps,
        });
    }

    public override async lintCode(code: string, linter: Linter = "pylint"): Promise<Array<WorkerDiagnostic>> {
        if (linter === "ruff") {
            // ruff resolves nothing at import time, so the imports need not be installed
            const workspace = await (this.ruff ?? PythonWorker.loadRuff());
            const start = performance.now();
            const diagnostics = toWorkerDiagnostics(workspace.check(code));
            this.lintTimings.last = { linter, install: 0, lint: performance.now() - start };
            return diagnostics;
        }
        const start = performance.now();
        await this.installImports(code);
        const installed = performance.now();
        const diagnostics = PythonWorker.convert(this.papyros?.lint(code) || []);
        this.lintTimings.last = { linter, install: installed - start, lint: performance.now() - installed };
        return diagnostics;
    }

    /**
     * Timings measured for the ruff spike; not part of the editor flow
     * @return {Promise<LintTimings>} When each linter became ready and how long the last lint took
     */
    public async getLintTimings(): Promise<LintTimings> {
        return this.lintTimings;
    }

    public override async provideFiles(
        inlineFiles: Record<string, string>,
        hrefFiles: Record<string, string>,
    ): Promise<void> {
        await this.papyros?.provide_files.callKwargs({
            inline_files: JSON.stringify(inlineFiles),
            href_files: JSON.stringify(hrefFiles),
        });
    }

    public override async deleteFile(name: string): Promise<void> {
        await this.papyros?.delete_file(name);
    }

    public override async updateFile(name: string, content: string, binary: boolean): Promise<void> {
        await this.papyros?.update_file(name, content, binary);
    }

    public override async renameFile(oldName: string, newName: string): Promise<void> {
        await this.papyros?.rename_file(oldName, newName);
    }
}
