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
}
declare function importScripts(...urls: string[]): void;
declare function loadPyodide(args: LoadPyodideArgs): Promise<Pyodide>;

// eslint-disable-line
importScripts("https://cdn.jsdelivr.net/pyodide/v0.18.1/full/pyodide.js"); 


class PythonWorker implements Backend {
    pyodide: Pyodide;
    constructor(){
        this.pyodide = {} as Pyodide;
    }
    async launch(){
        this.pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
            fullStdLib: true
        });
        await this.runCode(INITIALIZATION_CODE, (e) => {});
    }

    async runCode(code: string, onData: (e: PapyrosEvent) => void){
        console.log("running code in python worker: " + code);
    }

    async terminateExecution(){

    }

    async shutdown(){

    }

    send(e: PapyrosEvent){
        console.log("got data in send: ", e);
    }
}

expose(new PythonWorker());