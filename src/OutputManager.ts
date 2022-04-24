import escapeHTML from "escape-html";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { BackendManager } from "./BackendManager";
import { inCircle } from "./util/HTMLShapes";
import {
    getElement, parseData,
    t
} from "./util/Util";
import { LogType, papyrosLog } from "./util/Logging";
import {
    addAttributes,
    appendClasses, Renderable,
    RenderOptions, renderWithOptions
} from "./util/Rendering";

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
export class OutputManager extends Renderable {
    /**
     * Store the HTML that is rendered to restore when changing language/theme
     */
    private content: Array<string>;

    constructor() {
        super();
        this.content = [];
        BackendManager.subscribe(BackendEventType.Start, () => this.reset());
        BackendManager.subscribe(BackendEventType.Output, e => this.showOutput(e));
        BackendManager.subscribe(BackendEventType.Error, e => this.showError(e));
    }

    /**
     * Retrieve the parent element containing all output parts
     */
    get outputArea(): HTMLElement {
        return getElement(this.renderOptions.parentElementId);
    }

    /**
     * Render an element in the next position of the output area
     * @param {string} html Safe string version of the next child to render
     */
    renderNextElement(html: string): void {
        this.content.push(html);
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
        if (output.contentType && output.contentType.startsWith("img")) {
            this.renderNextElement(`<img src="data:${output.contentType}, ${data}"></img>`);
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
        papyrosLog(LogType.Debug, "Showing error: ", errorData);
        if (typeof (errorData) === "string") {
            errorHTML = this.spanify(errorData, false, "_tw-text-red-500");
        } else {
            const errorObject = errorData as FriendlyError;
            let shortTraceback = (errorObject.where || "").trim();
            // Prepend a bit of indentation, so every part has indentation
            if (shortTraceback) {
                shortTraceback = this.spanify("  " + shortTraceback, true, "where");
            }
            errorHTML += "<div class=\"_tw-text-red-500 _tw-text-bold\">";
            const infoQM = inCircle("?", escapeHTML(errorObject.info),
                // eslint-disable-next-line max-len
                "_tw-text-blue-500 _tw-border-blue-500 dark:_tw-text-dark-mode-blue dark:_tw-border-dark-mode-blue");
            const tracebackEM = inCircle("!",
                escapeHTML(errorObject.traceback), "_tw-text-red-500 _tw-border-red-500");
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

    protected override _render(options: RenderOptions): void {
        addAttributes(options,
            new Map([["data-placeholder", t("Papyros.output_placeholder")]]));
        appendClasses(options,
            // eslint-disable-next-line max-len
            "_tw-border-2 _tw-w-full _tw-min-h-1/4 _tw-max-h-3/5 _tw-overflow-auto _tw-py-1" +
            " _tw-px-2 _tw-whitespace-pre _tw-rounded-lg" +
            " dark:_tw-border-dark-mode-content with-placeholder");
        renderWithOptions(options, "");
        this.content.forEach(html => this.renderNextElement(html));
    }

    /**
     * Clear the contents of the output area
     */
    reset(): void {
        this.content = [];
        this.render();
    }
}
