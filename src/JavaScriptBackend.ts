import { Backend } from "./Backend";

export class JavaScriptBackend implements Backend {

    async launch() {
        return Promise.resolve(this);
    }

    async runCode(code: string){
        // Code is run in the browser of the user
        // eslint-disable-next-line
        return Promise.resolve(eval(code));
    }

    async shutdown(){
        return Promise.resolve();
    }
}