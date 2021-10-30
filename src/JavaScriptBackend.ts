import { Backend } from "./Backend";
import { PapyrosEvent } from "./PapyrosEvent";

export class JavaScriptBackend implements Backend {

    async launch(onData: (e: any) => void) {
        return Promise.resolve();
    }

    async runCode(code: string){
        // Code is run in the browser of the user
        // eslint-disable-next-line
        return Promise.resolve(eval(code));
    }

    async shutdown(){
        return Promise.resolve();
    }

    terminateExecution(){

    }

    send(data: PapyrosEvent){
      
    }
}