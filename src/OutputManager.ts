import escapeHTML from "escape-html";
import { inCircle } from "./util/HTMLShapes";

export interface FriendlyError {
    name: string;
    traceback?: string;
    info?: string;
    why?: string;
    what?: string;
    where?: string;
    suggestions?: string;
}

function newLine(): string {
    return "<br/>";
}

export class OutputManager {
    outputArea: HTMLElement;
    constructor(outputWrapperId: string) {
        this.outputArea = document.getElementById(outputWrapperId) as HTMLElement;
    }

    renderNextElement(html: string): void {
        this.outputArea.insertAdjacentHTML("beforeend", html);
    }

    newLine(): void {
        this.renderNextElement("<br/>");
    }

    spanify(text: string, ignoreEmpty = false): string {
        if (text === "\n") {
            return newLine();
        } else if (text.includes("\n")) {
            return text.split("\n")
                .filter(text => !ignoreEmpty || text.trim().length > 0)
                .map(text => `<span>${escapeHTML(text)}</span><br/>`)
                .join("\n");
        } else {
            return `<span>${escapeHTML(text)}</span>`;
        }
    }

    showOutput(output: string): void {
        this.renderNextElement(this.spanify(output));
    }

    showError(error: FriendlyError): void {
        console.log("Got friendly error: ", error);
        let errorHTML = "";
        const shortTraceback = (error.where || error.traceback || "").trim();
        errorHTML +=
            `<div class="text-red-500 text-bold">
                ${inCircle("?", error.info)}${error.name} traceback: <br/>
                ${this.spanify(shortTraceback, true)}
            </div>`;
        errorHTML += newLine();
        if (error.what) {
            errorHTML += this.spanify(error.what.trim(), true) + newLine();
        }
        if (error.why) {
            errorHTML += this.spanify(error.why.trim(), true) + newLine();
        }
        if (error.suggestions) {
            errorHTML += this.spanify(error.suggestions, true) + newLine();
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
