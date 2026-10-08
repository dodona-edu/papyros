import { css, html, TemplateResult } from "lit";
import "@material/web/progress/circular-progress";

/** A line of text after a spinner, for something the playground is waiting on */
export function renderStatus(text: string, extraClass = ""): TemplateResult {
    return html`<div class="status-line ${extraClass}">
        <md-circular-progress indeterminate aria-hidden="true"></md-circular-progress>${text}
    </div>`;
}

export const statusStyles = css`
    .status-line {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--md-sys-color-on-surface);
    }

    md-circular-progress {
        --md-circular-progress-size: 14px;
        flex-shrink: 0;
    }
`;
