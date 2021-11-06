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
            if(!inputTextArray || !inputMetaData){
                const request = new XMLHttpRequest();
                request.open('GET', '/input', false);  // `false` makes the request synchronous
                request.send(null);
                if (request.status === 200) {
                    console.log(request.responseText);
                }
                return request.responseText;
            } else {
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
        }
        this.onEvent = (e => {
            //console.log("Handling event in this.onEvent JS", e);
            onEvent(e);
            if(e.type === "input"){
                return inputCallback(e);
            }
        });
    }

    getFunctionToRun(code: string){
        const toRestore = new Map([
            ["prompt", "__prompt"],
            ["console.log", "__papyros_log"],
            ["console.error", "__papyros_error"]
        ]);
        const overrideBuiltins = `
function prompt(text="", defaultText=""){
    console.log(text);
    return __onEvent({"type": "input", "data": text});
}
function __stringify(args, addNewline=false){
    let asString = "";
    if(Array.isArray(args)){
        if(args.length === 1){
            asString = JSON.stringify(args[0]);
        } else {
            asString = args.map(s => JSON.stringify(s)).join(" ");
        }
    } else {
        asString = JSON.stringify(args);
    }
    if(addNewline){
        asString += "\\n";
    }
    return asString;
}
console.log = (...args) => {
    __onEvent({"type": "output", "data": __stringify(args, true)});
}
console.error = (...args) => {
    __onEvent({"type": "error", "data": __stringify(args, true)});
}
        `
        const newContext = {
            "__onEvent": this.onEvent.bind(this)
        };
        const restoreBuiltins = [];
        const newBody = [];
        for(const k in newContext){
            newBody.push(`const ${k} = ctx['${k}'];`);
        }
        for(let [fn, backup] of toRestore.entries()){
            newBody.push(`${backup} = ${fn}`);
            restoreBuiltins.push(`${fn} = ${backup}`)
        }
        newBody.push(overrideBuiltins);
        newBody.push(`
try {
${code}
} finally {
${restoreBuiltins.join('\n')}
}
        `);
        const fnBody = newBody.join('\n');
        console.log(fnBody);
        // eslint-disable-next-line no-new-func
        return new Function("ctx", fnBody)(newContext);
    }

    async runCode(code: string){
        //console.log("Running code in worker: ", code);
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
}

expose(new JavaScriptWorker());