import { expose } from 'comlink';
import { Backend } from '../../Backend';
import { PapyrosEvent } from '../../PapyrosEvent';


class JavaScriptWorker implements Backend {

    onEvent: (e: PapyrosEvent) => void;

    constructor(){
        this.onEvent = () => {};
    }

    async launch(onEvent: (e: PapyrosEvent) => void, inputTextArray?: Uint8Array, inputMetaData?: Int32Array){
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
            console.log("Handling event in this.onEvent JS", e);
            onEvent(e);
            if(e.type === "input"){
                return inputCallback(e);
            }
        });
    }

    getFunctionToRun(code: string){
        const promptFn = `
        function prompt(text="", defaultText=""){
            console.log("Prompted user with text:" + text);
            return onEvent({"type": "input", "data": text});
        }
        
        `
        const newContext = {
            "onEvent": this.onEvent.bind(this)
        };
        const newBody = [];
        for(const k in newContext){
            newBody.push(`const ${k} = ctx['${k}'];`);
        }
        newBody.push(promptFn);
        newBody.push(code);
        const fnBody = newBody.join('\n');
        // eslint-disable-next-line no-new-func
        return new Function("ctx", fnBody)(newContext);
    }

    async runCode(code: string){
        console.log("Running code in worker: ", code);
        let result: PapyrosEvent;
        try {
            // eslint-disable-next-line
            result = {type: "success", data: this.getFunctionToRun(code)};
            console.log("ran code: " + code + " and received: ", result);
        } catch (error: any) {
            console.log("error in webworker:", error);
            result = {type: "error", data: error};
        }
        this.onEvent(result);
    }

    send(e: PapyrosEvent){
        console.log("got data in send: ", e);
    }
}

expose(new JavaScriptWorker());