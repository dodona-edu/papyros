import escapeHTML from "escape-html";
import { PapyrosEvent } from "./PapyrosEvent";
import { inCircle } from "./util/HTMLShapes";

export interface FriendlyError {
    name: string;
    traceback?: string;
    info?: string;
    why?: string;
    what?: string;
    where?: string;
}

function newLine(): string {
    return "\n";
}

export class OutputManager {
    outputArea: HTMLElement;
    constructor(outputWrapperId: string) {
        this.outputArea = document.getElementById(outputWrapperId) as HTMLElement;
    }

    renderNextElement(html: string): void {
        this.outputArea.insertAdjacentHTML("beforeend", html);
    }

    spanify(text: string, ignoreEmpty = false): string {
        if (text.includes("\n") && text !== "\n") {
            text = text.endsWith("\n") ? text.substring(0, text.length - 1) : text;
            text = text.split("\n")
                .filter(line => !ignoreEmpty || line.trim().length > 0)
                .join("\n");
        }
        return `<span>${escapeHTML(text)}</span>`;
    }

    showOutput(output: PapyrosEvent): void {
        if (output.content === "img") {
            this.renderNextElement(`<img src="data:image/png;base64, ${output.data}"></img>`);
        } else {
            this.renderNextElement(this.spanify(output.data));
        }
    }

    showError(error: FriendlyError | string): void {
        console.log("Got friendly error: ", error);
        let errorHTML = "";
        let errorObject = {} as FriendlyError;
        if (typeof (error) === "string") {
            try {
                errorObject = JSON.parse(error) as FriendlyError;
            } catch (_) {
                errorHTML = this.spanify(error);
            }
        }
        if (Object.keys(errorObject).length > 0) {
            const shortTraceback = (errorObject.where || errorObject.traceback || "").trim();
            errorHTML +=
                // This HTML mustn't contain extra whitespace because it will be rendered literally
                `<div class="text-red-500 text-bold">` +
                    `${inCircle("?", errorObject.info)}${errorObject.name} traceback:` +
                    `${this.spanify(shortTraceback, true)}` +
                `</div>`;
            errorHTML += newLine();
            if (errorObject.what) {
                errorHTML += this.spanify(errorObject.what.trim(), true) + newLine();
            }
            if (errorObject.why) {
                errorHTML += this.spanify(errorObject.why.trim(), true) + newLine();
            }
        }

        this.renderNextElement(errorHTML);
    }

    onRunStart(): void {
        this.outputArea.textContent = "";
    }

    onRunEnd(): void {
        // currently empty
    }
}
