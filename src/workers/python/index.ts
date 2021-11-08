import { expose } from 'comlink';
import { Backend } from '../../Backend';
import { INITIALIZATION_CODE } from '../../backend.py';
import { PapyrosEvent } from '../../PapyrosEvent';

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

    constructor(){
        super();
        this.pyodide = {} as Pyodide;
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
            });
    }

    async runCode(code: string){
        console.log("Running code in worker: ", code);
        let result: PapyrosEvent;
        try {
            await this.pyodide.loadPackagesFromImports(code);
            result = {type: "success", data: await this.pyodide.runPythonAsync(code)};
            console.log("ran code: " + code + " and received: ", result);
        } catch (error: any) {
            console.log("error in webworker:", error);
            result = {type: "error", data: error};
        }
        this.onEvent(result);
    }
}

expose(new PythonWorker());