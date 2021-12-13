import { expose } from "comlink";
import { Backend } from "../../Backend";


class JavaScriptWorker extends Backend {
    override _runCodeInternal(code: string): Promise<any> {
        const toRestore = new Map([
            ["prompt", "__prompt"],
            ["console.log", "__papyros_log"],
            ["console.error", "__papyros_error"]
        ]);
        const overrideBuiltins = `
function prompt(text="", defaultText=""){
    const promptedValue = __onEvent({"type": "input", "data": text});
    return promptedValue;
}
function __stringify(args, addNewline=false){
    let asString = "";
    if(Array.isArray(args)){
        asString = JSON.stringify(args)
    } else if (typeof(args) === 'string') {
        asString = args;
    } else if ("toString" in args) {
        asString = args.toString();
    } else {
        asString = JSON.stringify(args);
    }
    if(addNewline){
        asString += "\\n";
    }
    return asString;
}
console.log = (...args) => {
    __onEvent({"type": "output", "data": __stringify(...args, true)});
}
console.error = (...args) => {
    __onEvent({"type": "error", "data": __stringify(...args, true)});
}
        `;
        const newContext = {
            "__onEvent": this.onEvent.bind(this)
        };
        const restoreBuiltins = [];
        const newBody = [];
        for (const k in newContext) {
            if (Object.prototype.hasOwnProperty.call(newContext, k)) {
                newBody.push(`const ${k} = ctx['${k}'];`);
            }
        }
        for (const [fn, backup] of toRestore.entries()) {
            newBody.push(`${backup} = ${fn}`);
            restoreBuiltins.push(`${fn} = ${backup}`);
        }
        newBody.push(overrideBuiltins);
        newBody.push(`
try {
${code}
} finally {
${restoreBuiltins.join("\n")}
}
        `);
        const fnBody = newBody.join("\n");
        // eslint-disable-next-line no-new-func
        return Promise.resolve(new Function("ctx", fnBody)(newContext));
    }
}

expose(new JavaScriptWorker());
export default null as any;
