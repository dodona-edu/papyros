import { Backend } from "./Backend";
import { INITIALIZATION_CODE } from "./backend.py";

interface LoadPyodideArgs {
    indexURL: string;
}
interface Pyodide {
runPythonAsync: (code: string) => Promise<any>;
loadPackagesFromImports: (code: string) => Promise<any>;
}
declare global {
    interface Window { loadPyodide: (args: LoadPyodideArgs) => Promise<Pyodide> }
}

window.loadPyodide = window.loadPyodide || {};

export class PythonBackend implements Backend {
    pyodide: Pyodide;

    constructor(){
        this.pyodide = {} as Pyodide;
    }

    async launch(){
        this.pyodide = await window.loadPyodide({
            indexURL : "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/"
          });
        await this.runCode(INITIALIZATION_CODE);
        return this;
    }

    async runCode(code: string){
        return this.pyodide.loadPackagesFromImports(code)
            .then(() => this.pyodide.runPythonAsync(code))
            .catch(e => {
          console.log(e);
          return e.toString()
        });
    }

    async shutdown(){
        return Promise.resolve();
    }
}