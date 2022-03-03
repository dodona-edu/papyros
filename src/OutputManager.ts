import escapeHTML from "escape-html";
import { PapyrosEvent } from "./PapyrosEvent";
import { RunListener } from "./RunListener";
import { inCircle } from "./util/HTMLShapes";
import { parseEventData, RenderOptions, renderWithOptions, t } from "./util/Util";

export interface FriendlyError {
    name: string;
    traceback?: string;
    info?: string;
    why?: string;
    what?: string;
    where?: string;
}

export class OutputManager implements RunListener {
    outputAreaId = "";
    options: RenderOptions = { parentElementId: "" };

    get outputArea(): HTMLElement {
        return document.getElementById(this.outputAreaId) as HTMLElement;
    }

    renderNextElement(html: string): void {
        this.outputArea.insertAdjacentHTML("beforeend", html);
    }

    spanify(text: string, ignoreEmpty = false): string {
        let spanText = text;
        if (spanText.includes("\n") && spanText !== "\n") {
            spanText = spanText.split("\n")
                .filter(line => !ignoreEmpty || line.trim().length > 0)
                .join("\n");
        }
        return `<span>${escapeHTML(spanText)}</span>`;
    }

    showOutput(output: PapyrosEvent): void {
        const data = parseEventData(output);
        if (output.contentType === "img/png;base64") {
            this.renderNextElement(`<img src="data:image/png;base64, ${data}"></img>`);
        } else {
            this.renderNextElement(this.spanify(data, false));
        }
    }

    showError(error: PapyrosEvent): void {
        let errorHTML = "";
        const errorData = parseEventData(error);
        if (typeof (errorData) === "string") {
            errorHTML = this.spanify(errorData);
        } else {
            const errorObject = errorData as FriendlyError;
            let shortTraceback = (errorObject.where || "").trim();
            // Prepend a bit of indentation, so every part has indentation
            if (shortTraceback) {
                shortTraceback = this.spanify("  " + shortTraceback, true);
            }
            errorHTML += "<div class=\"text-red-500 text-bold\">";
            const infoQM = inCircle("?", escapeHTML(errorObject.info), "blue-500");
            const tracebackEM = inCircle("!", escapeHTML(errorObject.traceback), "red-500");
            errorHTML += `${infoQM}${errorObject.name} traceback:${tracebackEM}\n`;
            errorHTML += shortTraceback;
            errorHTML += "</div>\n";
            if (errorObject.what) {
                errorHTML += this.spanify(errorObject.what.trim(), true) + "\n";
            }
            if (errorObject.why) {
                errorHTML += this.spanify(errorObject.why.trim(), true) + "\n";
            }
        }

        this.renderNextElement(errorHTML);
    }

    render(options: RenderOptions): HTMLElement {
        this.outputAreaId = options.parentElementId;
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
