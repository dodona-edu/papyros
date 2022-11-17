import escapeHTML from "escape-html";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import { BackendManager } from "./BackendManager";
import { renderInCircle } from "./util/HTMLShapes";
import {
    getElement, parseData,
    i18n
} from "./util/Util";
import { LogType, papyrosLog } from "./util/Logging";
import {
    Renderable,
    RenderOptions, renderWithOptions
} from "./util/Rendering";
import { OUTPUT_AREA_ID, OUTPUT_OVERFLOW_ID } from "./Constants";

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

    /**
     * Whether overflow has occurred
     */
    private overflown: boolean;
    /**
     * Function to call when the user wants to download overflow results
     */
    private downloadCallback: (() => void) | null;

    constructor() {
        super();
        this.content = [];
        this.overflown = false;
        this.downloadCallback = null;
        BackendManager.subscribe(BackendEventType.Start, () => this.reset());
        BackendManager.subscribe(BackendEventType.Output, e => this.showOutput(e));
        BackendManager.subscribe(BackendEventType.Error, e => this.showError(e));
        BackendManager.subscribe(BackendEventType.End, () => this.onRunEnd());
    }

    /**
     * Retrieve the parent element containing all output parts
     */
    private get outputArea(): HTMLElement {
        return getElement(OUTPUT_AREA_ID);
    }

    /**
     * Render an element in the next position of the output area
     * @param {string} html Safe string version of the next child to render
     * @param {boolean} isNewElement Whether this a newly generated element
     */
    private renderNextElement(html: string, isNewElement = true): void {
        if (isNewElement) { // Only save new ones to prevent duplicating
            this.content.push(html);
        }
        this.outputArea.insertAdjacentHTML("beforeend", html);
        // Ensure overflowElement is at the bottom
        const overflowElement = document.getElementById(OUTPUT_OVERFLOW_ID);
        if (overflowElement) {
            this.outputArea.append(overflowElement);
        }
        // Scroll to bottom to show latest output
        this.outputArea.scrollTop = this.outputArea.scrollHeight;
    }

    /**
     * Convert a piece of text to a span element for displaying
     * @param {string} text The text content for the span
     * @param {boolean} ignoreEmpty Whether to remove empty lines in the text
     * @param {string} className Optional class name for the span
     * @return {string} String version of the created span
     */
    private spanify(text: string, ignoreEmpty = false, className = ""): string {
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
    public showOutput(output: BackendEvent): void {
        const data = parseData(output.data, output.contentType);
        if (output.contentType && output.contentType.startsWith("img")) {
            this.renderNextElement(`<img src="data:${output.contentType}, ${data}"></img>`);
        } else {
            this.renderNextElement(this.spanify(data, false));
        }
    }

    /**
     * Display to the user that overflow has occurred, limiting the shown output
     * @param {function():void | null} downloadCallback Optional callback to download overflow
     */
    public onOverflow(downloadCallback: (() => void) | null): void {
        this.overflown = true;
        this.downloadCallback = downloadCallback;
        if (document.getElementById(OUTPUT_OVERFLOW_ID) == null) {
            this.renderNextElement(`
<div id=${OUTPUT_OVERFLOW_ID}><span class="_tw-text-red-500
 _tw-text-bold">${i18n.t("Papyros.output_overflow")}</span>
<a class="hover:_tw-cursor-pointer _tw-text-blue-500"
 hidden>${i18n.t("Papyros.output_overflow_download")}</a>
</div>`, false);
        }
        const overflowDiv = getElement(OUTPUT_OVERFLOW_ID);
        if (this.downloadCallback !== null) {
            const overflowLink = overflowDiv.lastElementChild as HTMLElement;
            overflowLink.hidden = false;
            overflowLink.addEventListener("click", this.downloadCallback);
        }
    }

    /**
     * Display an error to the user
     * @param {BackendEvent} error Event containing the error data
     */
    public showError(error: BackendEvent): void {
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
            const infoQM = renderInCircle("?", escapeHTML(errorObject.info),
                // eslint-disable-next-line max-len
                "_tw-text-blue-500 _tw-border-blue-500 dark:_tw-text-dark-mode-blue dark:_tw-border-dark-mode-blue");
            const tracebackEM = renderInCircle("!",
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
        renderWithOptions(options, `
    <div id=${OUTPUT_AREA_ID} class="_tw-border-2 _tw-w-full _tw-min-h-1/4
     _tw-max-h-3/5 _tw-overflow-auto papyros-font-family
    _tw-py-1 _tw-px-2 _tw-whitespace-pre _tw-rounded-lg dark:_tw-border-dark-mode-content
    with-placeholder" data-placeholder="${i18n.t("Papyros.output_placeholder")}"></div>
    `);
        // Restore previously rendered items
        this.content.forEach(html => this.renderNextElement(html, false));
        if (this.overflown) {
            this.onOverflow(this.downloadCallback);
        }
    }

    /**
     * Clear the contents of the output area
     */
    public reset(): void {
        this.content = [];
        this.overflown = false;
        this.downloadCallback = null;
        this.render();
    }

    private onRunEnd(): void {
        if (this.outputArea.childElementCount === 0) {
            this.outputArea.setAttribute("data-placeholder", i18n.t("Papyros.no_output"));
        }
    }
}
