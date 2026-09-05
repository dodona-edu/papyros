import { css, CSSResult } from "lit";

export const tabButtonStyles: CSSResult = css`
    button {
        padding: 0.375rem 0.75rem;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-bottom: 2px solid var(--md-sys-color-outline-variant);
        border-radius: 0.375rem 0.375rem 0 0;
        cursor: pointer;
        font-size: 0.875rem;
        background-color: var(--md-sys-color-surface);
        color: var(--md-sys-color-on-surface);
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    button.active {
        background-color: var(--md-sys-color-surface-variant);
        color: var(--md-sys-color-on-surface-variant);
        font-weight: 600;
        border-bottom: 2px solid var(--md-sys-color-primary);
    }

    button:hover:not(.active) {
        opacity: 0.8;
    }
`;

export const inlineInputStyles: CSSResult = css`
    .inline-input {
        font-size: 0.875rem;
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--md-sys-color-outline);
        border-radius: 0.375rem 0.375rem 0 0;
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
