import { expose } from 'comlink';
import { Backend } from '../../Backend';
import { PapyrosEvent } from '../../PapyrosEvent';
import { INITIALIZATION_CODE } from './init.py';

interface LoadPyodideArgs {
    indexURL: string;
    fullStdLib: boolean;
  }
interface Pyodide {
    runPythonAsync: (code: string) => Promise<any>;
    loadPackagesFromImports: (code: string) => Promise<any>;
    globals: Map<string, any>;
}
declare function importScripts(...urls: string[]): void;
declare function loadPyodide(args: LoadPyodideArgs): Promise<Pyodide>;

importScripts("https://cdn.jsdelivr.net/pyodide/v0.18.1/full/pyodide.js"); 


class PythonWorker extends Backend {
    pyodide: Pyodide;
    initialized: boolean; 

    constructor(){
        super();
        this.pyodide = {} as Pyodide;
        this.initialized = false;
    }

    launch(onEvent: (e: PapyrosEvent) => void, inputTextArray?: Uint8Array, inputMetaData?: Int32Array) : Promise<void> {
        return super.launch(onEvent, inputTextArray, inputMetaData)
            .then(() => loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
                fullStdLib: true
            }))
            .then(pyodide => {
                this.pyodide = pyodide;
                return this.runCode(INITIALIZATION_CODE);
            })
            .then(() => {
                this.pyodide.globals.get("__override_builtins")((data: Map<string, any>) => this.onEvent(Object.fromEntries(data) as PapyrosEvent));
                this.initialized = true;
            });
    }

    _runCodeInternal(code: string){
        return this.pyodide.loadPackagesFromImports(code)
                .then(() => {
                    if(this.initialized){
                        return this.pyodide.globals.get("__run_code")(code);
                    } else {
                        return this.pyodide.runPythonAsync(code);
                    }
                });
    }
}

expose(new PythonWorker());