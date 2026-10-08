import { css } from "lit";

/** The card, its toolbar with the Reset and Run/Stop buttons, and the editor */
export const cardStyles = css`
    :host {
        display: block;
        margin: 24px 0;
        color: var(--md-sys-color-on-surface);
    }

    .card {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-size: 16px;
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px;
        box-shadow:
            0 2px 4px -1px rgb(0, 0, 0, 0.14),
            0 4px 5px 0 rgb(0, 0, 0, 0.098),
            0 1px 10px 0 rgb(0, 0, 0, 0.084);
    }

    .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px 10px 16px;
        background: var(--md-sys-color-primary-container);
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        color: var(--md-sys-color-on-primary-container);
    }

    .title {
        min-width: 0;
        font-size: 16px;
        font-weight: 500;
        overflow-wrap: break-word;
    }

    .actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
    }

    .text-button,
    .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 36px;
        border: 0;
        border-radius: 20px;
        font-family: inherit;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
    }

    .text-button {
        padding: 0 14px;
        background: none;
        color: var(--md-sys-color-primary);
        transition: background 145ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .text-button:hover:not(:disabled, [aria-disabled="true"]) {
        background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
    }

    .pill {
        padding: 0 18px;
        background: var(--md-sys-color-primary);
        color: var(--md-sys-color-on-primary);
        transition: box-shadow 145ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .pill:hover:not(:disabled, [aria-disabled="true"]) {
        box-shadow:
            0 2px 4px -1px rgb(0, 0, 0, 0.14),
            0 4px 5px 0 rgb(0, 0, 0, 0.098),
            0 1px 10px 0 rgb(0, 0, 0, 0.084);
    }

    /* aria-disabled buttons stay focusable so screen readers can reach their reason
       text, so they need the disabled look without the disabled attribute. */
    button:disabled,
    button[aria-disabled="true"] {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .icon {
        display: inline-flex;
        flex: none;
    }

    .icon svg {
        width: 18px;
        height: 18px;
    }

    p-code {
        display: block;
        height: auto;
        min-height: 40px;
    }
`;

/** The input row, the output log and the error panels */
export const outputPanelStyles = css`
    .input-row,
    .output,
    .error {
        padding: 14px 16px;
        border-top: 1px solid var(--md-sys-color-outline-variant);
        font-size: 14px;
        line-height: 22px;
    }

    /* Not on .output itself: its panel label keeps the page's font */
    .input-row,
    .output-body,
    .error {
        font-family: sfmono-regular, menlo, monaco, consolas, "Liberation Mono", "Courier New", monospace;
    }

    .input-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        background: var(--md-sys-color-surface);
    }

    .prompt {
        white-space: pre-wrap;
        color: var(--md-sys-color-on-surface);
    }

    .input-row input {
        flex: 1;
        font: inherit;
        border: 0;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        background: transparent;
        color: inherit;
        padding: 2px 0;
    }

    .input-row input:focus {
        outline: none;
        border-bottom-color: var(--md-sys-color-primary);
    }

    .input-row input::placeholder {
        color: var(--md-sys-color-on-surface-variant);
    }

    .panel-label {
        margin-bottom: 6px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--md-sys-color-on-surface);
    }

    .output {
        max-height: 300px;
        overflow: auto;
        background: var(--md-sys-color-surface-container-high);
        color: var(--md-sys-color-on-surface);
    }

    .output-body {
        min-height: 22px;
    }

    .transcript {
        margin: 0;
        padding: 0;
        white-space: pre-wrap;
        word-break: normal;
        overflow-wrap: break-word;
        font: inherit;
    }

    .error {
        background: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
    }

    .error-title {
        font-weight: 700;
        white-space: pre-wrap;
        overflow-wrap: break-word;
    }
`;

/** The card shown instead of the playground when it is configured wrongly */
export const configErrorStyles = css`
    .config-error {
        padding: 14px 16px;
        background: var(--md-sys-color-error-container);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px;
        color: var(--md-sys-color-on-error-container);
    }

    .config-error-title {
        font-weight: 700;
    }
`;

/** The file tabs, the file previews and the alerts of files that failed to load */
export const fileStyles = css`
    [hidden] {
        display: none;
    }

    p-editor-tabs {
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }

    .file-panel {
        max-height: 300px;
        overflow: auto;
    }

    .file-status {
        padding: 14px 16px;
        font-size: 14px;
    }

    .file-error {
        padding: 14px 16px;
        background: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
        font-size: 14px;
    }
`;
