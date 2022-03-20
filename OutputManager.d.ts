import { BackendEvent } from "./BackendEvent";
import { RenderOptions } from "./util/Util";
/**
 * Shape of Error objects that are easy to interpret
 */
export interface FriendlyError {
    /**
     * The name of the Error
     */
    name: string;
    /**
     * Traceback for where in the code the Error occurred
     */
    traceback?: string;
    /**
     * General information about this type of Error
     */
    info?: string;
    /**
    * Information about what went wrong in this case
    */
    what?: string;
    /**
     * Information about why this is wrong and how to fix it
     */
    why?: string;
    /**
     * Where specifically in the source code the Error occurred
     */
    where?: string;
}
/**
 * Component for displaying code output or errors to the user
 */
export declare class OutputManager {
    options: RenderOptions;
    constructor();
    /**
     * Retrieve the parent element containing all output parts
     */
    get outputArea(): HTMLElement;
    /**
     * Render an element in the next position of the output area
     * @param {string} html Safe string version of the next child to render
     */
    renderNextElement(html: string): void;
    /**
     * Convert a piece of text to a span element for displaying
     * @param {string} text The text content for the span
     * @param {boolean} ignoreEmpty Whether to remove empty lines in the text
     * @param {string} className Optional class name for the span
     * @return {string} String version of the created span
     */
    spanify(text: string, ignoreEmpty?: boolean, className?: string): string;
    /**
     * Display output to the user, based on its content type
     * @param {BackendEvent} output Event containing the output data
     */
    showOutput(output: BackendEvent): void;
    /**
     * Display an error to the user
     * @param {BackendEvent} error Event containing the error data
     */
    showError(error: BackendEvent): void;
    /**
     * Render the OutputManager with the given options
     * @param {RenderOptions} options Options for rendering
     * @return {HTMLElement} The rendered output area
     */
    render(options: RenderOptions): HTMLElement;
    /**
     * Clear the contents of the output area
     */
    reset(): void;
}
