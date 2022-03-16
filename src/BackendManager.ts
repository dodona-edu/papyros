import { releaseProxy, Remote, wrap } from "comlink";
import { Backend } from "./Backend";
import { ProgrammingLanguage } from "./ProgrammingLanguage";
import PythonWorker from "./workers/python/PythonWorker.worker";
import JavaScriptWorker from "./workers/javascript/JavaScriptWorker.worker";
// Store Worker per Backend as Comlink proxy has no explicit reference to the Worker
// We need the Worker itself to be able to terminate it (@see stopBackend)
const BACKEND_MAP: Map<Remote<Backend>, Worker> = new Map();

const CREATE_WORKER_MAP: Map<ProgrammingLanguage, () => Worker> = new Map([
    [ProgrammingLanguage.Python, () => new PythonWorker()],
    [ProgrammingLanguage.JavaScript, () => new JavaScriptWorker()]
]);

/**
 * Start a backend for the given language, while storing the worker
 * @param {ProgrammingLanguage} language The programming language supported by the backend
 * @return {Remote<Backend>} A Comlink proxy for the Backend
 */
export function startBackend(language: ProgrammingLanguage): Remote<Backend> {
    if (CREATE_WORKER_MAP.has(language)) {
        const worker = CREATE_WORKER_MAP.get(language)!();
        const backend = wrap<Backend>(worker);
        // store worker itself in the map
        BACKEND_MAP.set(backend, worker);
        return backend;
    } else {
        throw new Error(`${language} is not yet supported.`);
    }
}

/**
 * Stop a backend by terminating the worker and releasing memory
 * @param {Remote<Backend>} backend The proxy for the backend to stop
 */
export function stopBackend(backend: Remote<Backend>): void {
    if (BACKEND_MAP.has(backend)) {
        const toStop = BACKEND_MAP.get(backend)!;
        toStop.terminate();
        backend[releaseProxy]();
        BACKEND_MAP.delete(backend);
    } else {
        throw new Error(`Unknown backend supplied for backend ${JSON.stringify(backend)}`);
    }
}
