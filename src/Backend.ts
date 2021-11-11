import { INPUT_RELATIVE_URL } from "./Constants";
import { PapyrosEvent } from "./PapyrosEvent";
import { LogType, papyrosLog } from "./util/Logging";

function getInputCallback(inputTextArray?: Uint8Array, inputMetaData?: Int32Array){
    if(!inputTextArray || !inputMetaData){
        return () => {
            const request = new XMLHttpRequest();
            do {
                request.open('GET', INPUT_RELATIVE_URL, false);  // `false` makes the request synchronous
                request.send(null);
            } while(request.status >= 400); // todo better error handling
            return request.responseText;
        }
    } else {
        const textDecoder = new TextDecoder();
        return () => {
            while (true) {
                if (Atomics.wait(inputMetaData, 0, 0, 100) === "timed-out") {
                    //papyrosLog.log("waiting on input");
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
    }
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

    abstract _runCodeInternal(code: string): Promise<any>;
    /**
     * Validate and run arbitrary code
     * @param {string} code The code to run
     */
    runCode(code: string): Promise<void> {
        papyrosLog(LogType.Debug, "Running code in worker: ", code);
        return this._runCodeInternal(code)
            .then(data => {
                papyrosLog(LogType.Important, "ran code: " + code + " and received: ", data);
                return this.onEvent({type: "success", data: data});
            })
            .catch(error => {
                const errorString = "toString" in error ? error.toString() : JSON.stringify(error);
                papyrosLog(LogType.Error, "Error during execution: ", error, errorString);
                return this.onEvent({type: "error", data: errorString});
            });
    }
};