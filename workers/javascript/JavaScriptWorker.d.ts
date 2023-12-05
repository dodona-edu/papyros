import { Backend, WorkerDiagnostic } from "../../Backend";
import { SyncExtras } from "comsync";
/**
 * Implementation of a JavaScript backend for Papyros
 * by using eval and overriding some builtins
 */
export declare class JavaScriptWorker extends Backend<SyncExtras> {
    /**
     * Convert varargs to a string, similar to how the console does it
     * @param {any[]} args The values to join into a string
     * @return {string} The string representation
     */
    private static stringify;
    /**
     * Prompt the user for input with a message
     * @param {string} text The message to show when asking for input
     * @return {string} The value the user gave
     */
    private prompt;
    /**
     * Print values to the output screen
     * @param {any[]} args The values to log
     */
    private consoleLog;
    /**
     * Print values to the error screen
     * @param {any[]} args The error values to log
     */
    private consoleError;
    /**
     * Helper method to generate suggestions based on properties in an object
     * @param {number} from Where in the document the autocompletion starts
     * @param {any} object Object with properties that might be relevant
     * @return {CompletionResult} Autocompletion suggestions
     */
    private static completeProperties;
    runCode(extras: SyncExtras, code: string): Promise<any>;
    lintCode(): Promise<Array<WorkerDiagnostic>>;
}
