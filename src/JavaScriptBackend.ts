import { Backend } from "./Backend";
import { PapyrosEvent } from "./PapyrosEvent";

export class JavaScriptBackend implements Backend {

    async launch() {
        return Promise.resolve(this);
    }

    async runCode(code: string, input: string, onData: (e: any) => void){
        // Code is run in the browser of the user
        // eslint-disable-next-line
        return Promise.resolve(eval(code));
    }

    async shutdown(){
        return Promise.resolve();
    }

    async terminateExecution(){
        return Promise.resolve();
    }

    send(data: PapyrosEvent){
      
    }
}