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


class PythonWorker implements Backend {
    pyodide: Pyodide;
    constructor(){
        this.pyodide = {} as Pyodide;
    }
    async launch(onEvent: (e: any) => void){
        this.pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
            fullStdLib: true
        });
        await this.runCode(INITIALIZATION_CODE);
        this.pyodide.globals.get("__capture_stdout")((data: Map<string, any>) => onEvent(Object.fromEntries(data)));
    }

    async runCode(code: string){
        let result: PapyrosEvent;
        try {
            await this.pyodide.loadPackagesFromImports(code);
            result = {type: "success", data: await this.pyodide.runPythonAsync(code)};
            console.log("ran code: " + code + " and received: ", result);
        } catch (error: any) {
            console.log("error in webworker:", error);
            result = {type: "error", data: error};
        }
    }

    terminateExecution(){
        // eslint-disable-next-line no-restricted-globals
        close();
    }

    async shutdown(){

    }

    send(e: PapyrosEvent){
        console.log("got data in send: ", e);
    }
}

expose(new PythonWorker());