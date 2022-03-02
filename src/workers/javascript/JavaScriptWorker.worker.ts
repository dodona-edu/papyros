import { expose } from "comlink";
import { Backend } from "../../Backend";


/**
 * Implementation of a JavaScript backend for Papyros
 * by using eval and overriding some builtins
 */
class JavaScriptWorker extends Backend {
    private stringify(...args: any[]): string {
        const asString = args.map(a => {
            if (Array.isArray(a)) {
                return JSON.stringify(a);
            } else if (typeof (a) === "string") {
                return a;
            } else if (typeof a === "number") {
                return a + "";
            } else if (typeof (a) === "object" && "toString" in a) {
                let aString = (a as any).toString();
                if (aString === "[object Object]") { // useless toString, so use JSON
                    aString = JSON.stringify(a);
                }
                return aString;
            } else {
                return JSON.stringify(args);
            }
        }).join(" ");
        return asString;
    }

    private prompt(text = ""): string {
        return this.onEvent({
            type: "input",
            data: this.stringify({ prompt: text }),
            contentType: "text/json",
            runId: this.runId
        });
    }

    private consoleLog(...args: any[]): void {
        this.onEvent({
            type: "output",
            data: this.stringify(...args) + "\n",
            runId: this.runId,
            contentType: "text/plain"
        });
    }

    private consoleError(...args: any[]): void {
        this.onEvent({
            type: "error",
            data: this.stringify(...args) + "\n",
            contentType: "text/plain",
            runId: this.runId
        });
    }

    /**
     * @inheritdoc
     */
    override _runCodeInternal(code: string): Promise<any> {
        const newBody = []; // Lines of code forming the body of the code to run

        // Builtins to store before execution and restore afterwards
        const toRestore = new Map([
            ["console.log", "__builtin_console_log"],
            ["console.error", "__builtin_console_error"]
        ]);

        const restoreBuiltins = []; // overriden functions to restore at the end
        for (const [fn, backup] of toRestore.entries()) {
            // First save the originals
            newBody.push(`${backup} = ${fn}`);
            // Restore them, but add to function body later
            restoreBuiltins.push(`${fn} = ${backup}`);
        }
        // Arguments for the new function
        const newContext = {
            "prompt": this.prompt.bind(this),
            "console.log": this.consoleLog.bind(this),
            "console.error": this.consoleError.bind(this)
        };
        // Unpack them to make them easily available
        for (const k of Object.keys(newContext)) {
            newBody.push(`${k} = ctx['${k}']`);
        }
        // Run the code, restoring builtins at the end
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
// Default export to be recognized as a TS module
export default null as any;
