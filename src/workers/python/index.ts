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
    onEvent: (e: PapyrosEvent) => void;

    constructor(){
        this.pyodide = {} as Pyodide;
        this.onEvent = (_e) => {};
    }

    async launch(onEvent: (e: PapyrosEvent) => void, inputTextArray?: Uint8Array, inputMetaData?: Int32Array){
        this.pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
            fullStdLib: true
        });
        const textDecoder = new TextDecoder();
        const inputCallback = (e: PapyrosEvent) => {
            if(e.type !== "input"){
                console.log("Invalid event passed to inputCallback", e);
                return "__INVALID_MESSAGE";
            }
            console.log("Handling inputEvent", e);
            if(inputTextArray && inputMetaData){
                while (true) {
                    if (Atomics.wait(inputMetaData, 0, 0, 100) === "timed-out") {
                        console.log("waiting on input");
                      //if (interruptBuffer[0] === 2) {
                      //  return null;
                      //}
                    } else {
                      break
                    }
                  }
                  Atomics.store(inputMetaData, 0, 0);
                  const size = Atomics.exchange(inputMetaData, 1, 0);
                  const bytes = inputTextArray.slice(0, size);
                  return textDecoder.decode(bytes);
            }
        }

        this.onEvent = (e => {
            console.log("Handling event in this.onEvent PY", e);
            onEvent(e);
            if(e.type === "input"){
                return inputCallback(e);
            }
        });
        await this.runCode(INITIALIZATION_CODE);
        this.pyodide.globals.get("__override_builtins")((data: Map<string, any>) => this.onEvent(Object.fromEntries(data) as PapyrosEvent));
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