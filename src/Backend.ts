import { PapyrosEvent } from "./PapyrosEvent";

function getInputCallback(inputTextArray?: Uint8Array, inputMetaData?: Int32Array){
    //if(!inputTextArray || !inputMetaData){
        return () => {
            const request = new XMLHttpRequest();
            do {
                request.open('GET', '/input', false);  // `false` makes the request synchronous
                request.send(null);
            } while(request.status >= 400);
            return request.responseText;
        }
    /*} else {
        const textDecoder = new TextDecoder();
        return () => {
            while (true) {
                if (Atomics.wait(inputMetaData, 0, 0, 100) === "timed-out") {
                    //console.log("waiting on input");
                //if (interruptBuffer[0] === 2) {
                //  return null;
                //}
                } else {
                    break;
                }
            }
            Atomics.store(inputMetaData, 0, 0);
            const size = Atomics.exchange(inputMetaData, 1, 0);
            const bytes = inputTextArray.slice(0, size);
            return textDecoder.decode(bytes);
        }
    }*/
}

export abstract class Backend {

    onEvent: (e: PapyrosEvent) => void;

    constructor(){
        this.onEvent = (_e) => {};
    }
    /**
     * Initialize the backend, setting up any globals required
     * @param {(e: PapyrosEvent) => void} onData Callback for when events occur
     */
    launch(onEvent: (e: PapyrosEvent) => void, inputTextArray?: Uint8Array, inputMetaData?: Int32Array) : Promise<void> {
        const inputCallback = getInputCallback(inputTextArray, inputMetaData);
        this.onEvent = (e: PapyrosEvent) => {
            onEvent(e);
            if(e.type === "input"){
                return inputCallback();
            }
        }
        return Promise.resolve();
    }
    /**
     * Validate and run arbitrary code
     * @param {string} code The code to run
     */
    abstract runCode(code: string): void;
};