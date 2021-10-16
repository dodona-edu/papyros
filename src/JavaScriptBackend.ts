import { Backend } from "./Backend";

export class JavaScriptBackend implements Backend {

    async launch(): Promise<JavaScriptBackend> {
        return Promise.resolve(this);
    }

    async runCode(code: string){
        // eslint-disable-next-line
        return Promise.resolve(eval(code));
    }
}