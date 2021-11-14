/* eslint-disable import/no-webpack-loader-syntax */
import { releaseProxy, Remote, wrap } from 'comlink';
import { Backend } from "./Backend";

// Store Worker per Backend as Comlink proxy has no explicit reference to the Worker
// We need the Worker itself to be able to terminate it (@see stopBackend)
const BACKEND_MAP: Map<Remote<Backend>, Worker> = new Map();

export function getBackend(language: string): Remote<Backend> {
    language = language.toLowerCase();
    let worker;
    switch(language){
        // Requires switch to have actual string constants and make webpack bundle the workers
        case "python": {
            worker = new Worker(new URL('./workers/python/PythonWorker.worker.ts', import.meta.url));
            break;
        }
        
        case "javascript": {
            worker = new Worker(new URL('./workers/javascript/JavaScriptWorker.worker.ts', import.meta.url));
            break;
        }
        
        default: {
            throw new Error(`${language} is not yet supported.`);
        }
    }
    const backend =  wrap<Backend>(worker);
    // store worker itself in the map
    BACKEND_MAP.set(backend, worker);
    return backend;
}

export function stopBackend(backend: Remote<Backend>){
    if(BACKEND_MAP.has(backend)){
        const toStop = BACKEND_MAP.get(backend)!;
        toStop.terminate();
        backend[releaseProxy]();
        BACKEND_MAP.delete(backend);
    } else {
        throw new Error(`Unknown backend supplied for language ${backend.toString()}`);
    }
}
