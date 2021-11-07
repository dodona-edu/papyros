import { expose } from 'comlink';
import { Backend } from '../../Backend';
import { PapyrosEvent } from '../../PapyrosEvent';


class JavaScriptWorker extends Backend {

    getFunctionToRun(code: string){
        const toRestore = new Map([
            ["prompt", "__prompt"],
            ["console.log", "__papyros_log"],
            ["console.error", "__papyros_error"]
        ]);
        const overrideBuiltins = `
function prompt(text="", defaultText=""){
    __onEvent({"type": "output", "data": text});
    const promptedValue = __onEvent({"type": "input", "data": text});
    __onEvent({"type": "output", "data": promptedValue + "\\n"});
    return promptedValue;
}
function __stringify(args, addNewline=false){
    let asString = "";
    if(Array.isArray(args)){
        if(args.length === 1){
            asString = JSON.stringify(args[0]);
        } else {
            asString = args.map(s => {
                if(typeof s === 'string' || s instanceof String){
                    return s; // prevent spurious quotes
                } else {
                    return JSON.stringify(s);
                }
            }).join(" ");
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
        // eslint-disable-next-line no-new-func
        return new Function("ctx", fnBody)(newContext);
    }

    runCode(code: string){
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