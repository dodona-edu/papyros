import { expose } from "comlink";
import { Backend } from "../../Backend";


/**
 * Implementation of a JavaScript backend for Papyros
 * by using eval and overriding some builtins
 */
class JavaScriptWorker extends Backend {
    /**
     * Convert varargs to a string, similar to how the console does it
     * @param {any[]} args The values to join into a string
     * @return {string} The string representation
     */
    private static stringify(...args: any[]): string {
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

    /**
     * Prompt the user for input with a message
     * @param {string} text The message to show when asking for input
     * @return {string} The value the user gave
     */
    private prompt(text = ""): string {
        return this.onEvent({
            type: "input",
            data: JavaScriptWorker.stringify({ prompt: text }),
            contentType: "text/json",
            runId: this.runId
        });
    }

    /**
     * Print values to the output screen
     * @param {any[]} args The values to log
     */
    private consoleLog(...args: any[]): void {
        this.onEvent({
            type: "output",
            data: JavaScriptWorker.stringify(...args) + "\n",
            runId: this.runId,
            contentType: "text/plain"
        });
    }

    /**
     * Print values to the error screen
     * @param {any[]} args The error values to log
     */
    private consoleError(...args: any[]): void {
        this.onEvent({
            type: "error",
            data: JavaScriptWorker.stringify(...args) + "\n",
            contentType: "text/plain",
            runId: this.runId
        });
    }

    /**
     * @inheritdoc
     */
    override _runCodeInternal(code: string): Promise<any> {
        // Builtins to store before execution and restore afterwards
        // Workers do not have access to prompt
        const oldContent = {
            "console.log": console.log,
            "console.error": console.error
        };

        // Overrides for the builtins
        const newContext = {
            "prompt": this.prompt.bind(this),
            "console.log": this.consoleLog.bind(this),
            "console.error": this.consoleError.bind(this)
        };
        // Override the builtins
        new Function("ctx",
            Object.keys(newContext).map(k => `${k} = ctx['${k}'];`).join("\n")
        )(newContext);
        try { // run the user's code
            return Promise.resolve(eval(code));
        } catch (error: any) { // try to create a friendly traceback
            Error.captureStackTrace(error);
            return Promise.resolve(this.onEvent({
                type: "error",
                runId: this.runId,
                contentType: "text/json",
                data: JSON.stringify({
                    name: error.constructor.name,
                    what: error.message,
                    traceback: error.stack
                })
            }));
        } finally { // restore the old builtins
            new Function("ctx",
                Object.keys(oldContent).map(k => `${k} = ctx['${k}'];`).join("\n")
            )(oldContent);
        }
    }
}

expose(new JavaScriptWorker());
// Default export to be recognized as a TS module
export default null as any;
