import { css, CSSResult } from "lit";

/** A 36px tab bar with a hairline under it; the active tab carries a 2px indicator on that line. */
export const tabBarStyles: CSSResult = css`
    .tab-bar {
        display: flex;
        flex-direction: row;
        height: 2.25rem;
        flex-shrink: 0;
        padding: 0 0.125rem;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        background-color: var(--md-sys-color-surface);
        overflow-x: auto;
    }
`;

export const tabButtonStyles: CSSResult = css`
    button {
        position: relative;
        height: 100%;
        padding: 0 0.875rem;
        border: none;
        background: transparent;
        color: var(--md-sys-color-on-surface-variant);
        font: inherit;
        font-size: 0.875rem;
        cursor: pointer;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    button.active {
        color: var(--md-sys-color-primary);
        font-weight: 500;
    }

    button.active::after {
        content: "";
        position: absolute;
        left: 0.625rem;
        right: 0.625rem;
        bottom: -1px;
        height: 2px;
        border-radius: 2px 2px 0 0;
        background-color: var(--md-sys-color-primary);
    }

    button:hover:not(.active) {
        color: var(--md-sys-color-on-surface);
    }

    button:focus-visible {
        outline: 2px solid var(--md-sys-color-primary);
        outline-offset: -2px;
        border-radius: 0.25rem;
    }
`;

/** A bordered surface that holds a tab bar and its content. */
export const paneStyles: CSSResult = css`
    .pane {
        display: flex;
        flex-direction: column;
        min-height: 0;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 0.625rem;
        background-color: var(--md-sys-color-surface);
        overflow: hidden;
    }
`;

export const inlineInputStyles: CSSResult = css`
    .inline-input {
        box-sizing: border-box;
        height: 1.625rem;
        margin: auto 0.25rem;
        font: inherit;
        font-size: 0.875rem;
        padding: 0 0.5rem;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 0.375rem;
        background-color: var(--md-sys-color-surface);
        color: var(--md-sys-color-on-surface);
        width: 8rem;
    }

    .inline-input:focus-visible {
        outline: 2px solid var(--md-sys-color-primary);
        outline-offset: -1px;
    }

    .inline-input.invalid {
        border-color: var(--md-sys-color-error);
    }

    .inline-input.invalid:focus-visible {
        outline-color: var(--md-sys-color-error);
    }
`;

export const visuallyHiddenStyles: CSSResult = css`
    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
    }
`;
