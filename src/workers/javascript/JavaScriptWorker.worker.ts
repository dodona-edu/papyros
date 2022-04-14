import { expose } from "comlink";
import { Backend, WorkerAutocompleteContext } from "../../Backend";
import { CompletionResult } from "@codemirror/autocomplete";
import { javascriptLanguage } from "@codemirror/lang-javascript";

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

    override async autocomplete(context: WorkerAutocompleteContext):
        Promise<CompletionResult | null> {
        const completePropertyAfter = ["PropertyName", ".", "?."];
        const dontCompleteIn = ["TemplateString", "LineComment", "BlockComment",
            "VariableDefinition", "PropertyDefinition"];
        const nodeBefore = javascriptLanguage.parser.parse(context.text)
            .resolveInner(context.pos, -1);
        const globalWindow = self as any;
        if (completePropertyAfter.includes(nodeBefore.name) &&
            nodeBefore.parent?.name == "MemberExpression") {
            const object = nodeBefore.parent.getChild("Expression");
            if (object?.name == "VariableName") {
                const from = /\./.test(nodeBefore.name) ? nodeBefore.to : nodeBefore.from;
                const variableName = context.text.slice(object.from, object.to);
                if (typeof globalWindow[variableName] == "object") {
                    return JavaScriptWorker.completeProperties(from, globalWindow);
                }
            }
        } else if (nodeBefore.name == "VariableName") {
            return JavaScriptWorker.completeProperties(nodeBefore.from, globalWindow);
        } else if (context.explicit && !dontCompleteIn.includes(nodeBefore.name)) {
            return JavaScriptWorker.completeProperties(context.pos, globalWindow);
        }
        return null;
    }

    /**
     * Helper method to generate suggestions based on properties in an object
     * @param {number} from Where in the document the autocompletion starts
     * @param {any} object Object with properties that might be relevant
     * @return {CompletionResult} Autocompletion suggestions
     */
    private static completeProperties(from: number, object: any): CompletionResult {
        const options = Object.keys(object).map(name => {
            return {
                label: name,
                type: typeof object[name] === "function" ? "function" : "variable"
            };
        });
        const ret = {
            from,
            options,
            span: /^[\w$]*$/
        };
        return ret;
    }

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

// Default export to be recognized as a TS module
export default {} as any;
// Expose handles the actual export
expose(new JavaScriptWorker());
