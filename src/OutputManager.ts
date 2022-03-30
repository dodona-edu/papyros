import escapeHTML from "escape-html";
import { BackendEvent } from "./BackendEvent";
import { RunListener } from "./RunListener";
import { inCircle } from "./util/HTMLShapes";
import {
    getElement, parseData,
    RenderOptions, renderWithOptions, t
} from "./util/Util";

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
export class OutputManager implements RunListener {
    // Store options to allow re-rendering
    options: RenderOptions = { parentElementId: "" };

    /**
     * Retrieve the parent element containing all output parts
     */
    get outputArea(): HTMLElement {
        return getElement(this.options.parentElementId);
    }

    /**
     * Render an element in the next position of the output area
     * @param {string} html Safe string version of the next child to render
     */
    renderNextElement(html: string): void {
        this.outputArea.insertAdjacentHTML("beforeend", html);
    }

    /**
     * Convert a piece of text to a span element for displaying
     * @param {string} text The text content for the span
     * @param {boolean} ignoreEmpty Whether to remove empty lines in the text
     * @param {string} className Optional class name for the span
     * @return {string} String version of the created span
     */
    spanify(text: string, ignoreEmpty = false, className = ""): string {
        let spanText = text;
        if (spanText.includes("\n") && spanText !== "\n") {
            spanText = spanText.split("\n")
                .filter(line => !ignoreEmpty || line.trim().length > 0)
                .join("\n");
        }
        return `<span class="${className}">${escapeHTML(spanText)}</span>`;
    }

    /**
     * Display output to the user, based on its content type
     * @param {BackendEvent} output Event containing the output data
     */
    showOutput(output: BackendEvent): void {
        const data = parseData(output.data, output.contentType);
        if (output.contentType === "img/png;base64") {
            this.renderNextElement(`<img src="data:image/png;base64, ${data}"></img>`);
        } else {
            this.renderNextElement(this.spanify(data, false));
        }
    }

    /**
     * Display an error to the user
     * @param {BackendEvent} error Event containing the error data
     */
    showError(error: BackendEvent): void {
        let errorHTML = "";
        const errorData = parseData(error.data, error.contentType);
        if (typeof (errorData) === "string") {
            errorHTML = this.spanify(errorData, false, "text-red-500");
        } else {
            const errorObject = errorData as FriendlyError;
            let shortTraceback = (errorObject.where || "").trim();
            // Prepend a bit of indentation, so every part has indentation
            if (shortTraceback) {
                shortTraceback = this.spanify("  " + shortTraceback, true, "where");
            }
            errorHTML += "<div class=\"text-red-500 text-bold\">";
            const infoQM = inCircle("?", escapeHTML(errorObject.info), "blue-500");
            const tracebackEM = inCircle("!", escapeHTML(errorObject.traceback), "red-500");
            errorHTML += `${infoQM}${errorObject.name} traceback:${tracebackEM}\n`;
            errorHTML += shortTraceback;
            errorHTML += "</div>\n";
            if (errorObject.what) {
                errorHTML += this.spanify(errorObject.what.trim(), true, "what") + "\n";
            }
            if (errorObject.why) {
                errorHTML += this.spanify(errorObject.why.trim(), true, "why") + "\n";
            }
        }
        this.renderNextElement(errorHTML);
    }

    /**
     * Render the OutputManager with the given options
     * @param {RenderOptions} options Options for rendering
     * @return {HTMLElement} The rendered output area
     */
    render(options: RenderOptions): HTMLElement {
        options.attributes = new Map([
            ["data-placeholder", t("Papyros.output_placeholder")],
            ...(options.attributes || [])
        ]);
        const initialClassNames = options.classNames ? options.classNames + " " : "";
        // eslint-disable-next-line max-len
        options.classNames = `${initialClassNames}border-2 w-full min-h-1/4 max-h-3/5 overflow-auto py-1 px-2 whitespace-pre with-placeholder`;
        this.options = options;
        return renderWithOptions(options, "");
    }

    /**
     * Clear the contents of the output area
     */
    reset(): void {
        this.render(this.options);
    }

    onRunStart(): void {
        this.reset();
    }

    onRunEnd(): void {
        // currently empty
    }
}
