import { css, html, TemplateResult } from "lit";
import { DEFAULT_IMAGE_CONTENT_TYPE, FriendlyError, OutputEntry, OutputType } from "../../state/InputOutput";
import type { Papyros } from "../../state/Papyros";
import { visuallyHiddenStyles } from "../shared-styles";
import "../FriendlyError";

/**
 * Styles for the markup below; include them in the styles of any component that uses it.
 */
export const outputStyles = css`
    ${visuallyHiddenStyles}

    .output-img {
        display: block;
        max-width: 100%;
    }

    .why {
        display: block;
        margin-top: 6px;
        white-space: pre-wrap;
        overflow-wrap: break-word;
    }

    .overflow {
        margin: 0.5rem 0 0;
    }
`;

/**
 * The entries up to `max`, and whether there were more. Entries past the cut are neither
 * rendered nor walked on every render.
 */
export function shownOutput(entries: OutputEntry[], max: number): { shown: OutputEntry[]; truncated: boolean } {
    const truncated = entries.length > max;
    return { shown: truncated ? entries.slice(0, max) : entries, truncated };
}

export function renderImage(entry: OutputEntry, papyros: Papyros): TemplateResult {
    // The backends send the encoding along in the content type, e.g. "image/png;base64"
    const contentType = entry.contentType ?? DEFAULT_IMAGE_CONTENT_TYPE;
    return html`<img
        class="output-img"
        src="data:${contentType},${entry.content as string}"
        alt=${papyros.i18n.t("Papyros.image_alt")}
    />`;
}

export function isFriendlyError(error: unknown): error is FriendlyError {
    return typeof error === "object" && error !== null && "name" in error;
}

/**
 * A friendly error, or anything else as plain text: a backend may send an object of another shape.
 * @param {boolean} alert Announce the friendly error's heading as an alert, for errors shown outside a live region
 */
export function renderError(error: unknown, papyros: Papyros, alert = false): TemplateResult {
    if (!isFriendlyError(error)) {
        const text = typeof error === "string" ? error : JSON.stringify(error);
        return html`<span class="visually-hidden">${papyros.i18n.t("Papyros.error_prefix")}</span>${text}`;
    }
    return html`<p-friendly-error .error=${error} .papyros=${papyros} ?alert=${alert}></p-friendly-error>${
            error.why ? html`<span class="why">${error.why.trim()}</span>` : ""
        }`;
}

/**
 * Renders one output entry; turtle output is left to the caller
 */
export function renderEntry(entry: OutputEntry, papyros: Papyros): TemplateResult {
    if (entry.type === OutputType.stdout) {
        return html`${entry.content}`;
    } else if (entry.type === OutputType.img) {
        return renderImage(entry, papyros);
    } else if (entry.type === OutputType.stderr) {
        return html`<span class="error">${renderError(entry.content, papyros)}</span>`;
    }
    return html``;
}

/**
 * Plain text version of the output, for downloading what was not shown
 */
export function outputAsText(entries: OutputEntry[]): string {
    return entries
        .map((o) => {
            if (o.type === OutputType.img || o.type === OutputType.turtle) {
                return `[Image output of type ${o.contentType} omitted]\n`;
            } else if (o.type === OutputType.stdout) {
                return o.content as string;
            } else if (o.type === OutputType.stderr) {
                if (typeof o.content === "string") {
                    return `Error: ${o.content}\n`;
                }
                const errorObject = o.content as FriendlyError;
                let errorString = `Error: ${errorObject.name}\n`;
                if (errorObject.info) {
                    errorString += `Info: ${errorObject.info}\n`;
                }
                if (errorObject.traceback) {
                    errorString += `Traceback: ${errorObject.traceback}\n`;
                }
                if (errorObject.where) {
                    errorString += `Where: ${errorObject.where.trim()}\n`;
                }
                if (errorObject.what) {
                    errorString += `What: ${errorObject.what.trim()}\n`;
                }
                if (errorObject.why) {
                    errorString += `Why: ${errorObject.why.trim()}\n`;
                }
                return errorString;
            }
            return "[Unsupported output type omitted]\n";
        })
        .join("");
}

/**
 * Notice that the output past `shownLength` entries is not shown, with a link to download it
 */
export function renderOverflow(papyros: Papyros, shownLength: number): TemplateResult {
    // The file is only built on click: output keeps growing during a run, and a blob URL made
    // on every render would never be released.
    const download = (e: Event): void => {
        const link = e.currentTarget as HTMLAnchorElement;
        if (link.href.startsWith("blob:")) {
            URL.revokeObjectURL(link.href);
        }
        const blob = new Blob([outputAsText(papyros.io.output.slice(shownLength))], { type: "text/plain" });
        link.href = URL.createObjectURL(blob);
    };
    return html`<p class="overflow">
        ${papyros.i18n.t("Papyros.output_overflow")}
        <a href="#" download="papyros_output.txt" @click=${download}>
            ${papyros.i18n.t("Papyros.output_overflow_download")}
        </a>
    </p>`;
}
