import { css, html, nothing, TemplateResult } from "lit";
import "@material/web/progress/circular-progress";
import { prefersReducedMotion } from "../motion";

/** The spinner cannot be stilled from outside its shadow root, so it is left out under reduced motion. */
function renderSpinner(): TemplateResult | typeof nothing {
    return prefersReducedMotion()
        ? nothing
        : html`<md-circular-progress indeterminate aria-hidden="true"></md-circular-progress>`;
}

/** A line of text after a spinner, for something the playground is waiting on. */
export function renderStatus(text: string, extraClass = ""): TemplateResult {
    return html`<div class="status-line ${extraClass}">${renderSpinner()}${text}</div>`;
}

/**
 * The status of the run in the toolbar. The live region is always mounted, so the first
 * announcement is not missed; it has content only while there is a text.
 */
export function renderToolbarStatus(text: string): TemplateResult {
    const content = text ? html`${renderSpinner()}<span class="message" title=${text}>${text}</span>` : nothing;
    return html`<div class="toolbar-status" role="status" aria-live="polite">${content}</div>`;
}

export const statusStyles = css`
    .status-line,
    .toolbar-status {
        --md-circular-progress-size: 14px;
    }

    .status-line {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--md-sys-color-on-surface);
    }

    .toolbar-status {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1 1 0;
        min-width: 0;
        font-size: 14px;
    }

    /* Never shrinks below the spinner; the message truncates down to nothing. */
    .toolbar-status:not(:empty) {
        min-width: var(--md-circular-progress-size);
    }

    /* An empty status cancels the toolbar gap it adds. */
    .toolbar-status:empty {
        margin-left: -12px;
    }

    .toolbar-status .message {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .toolbar-status md-circular-progress {
        --md-circular-progress-active-indicator-color: var(--md-sys-color-on-primary-container);
    }

    md-circular-progress {
        flex-shrink: 0;
    }
`;
