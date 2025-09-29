import { css, CSSResult, html, TemplateResult } from "lit";
import "@dodona/trace-component"
import { customElement } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";

@customElement("p-debugger")
export class Debugger extends PapyrosElement {
    static override get styles(): CSSResult {
        return css`
            tc-trace,
            tc-trace * {
                /* Base / surface */
                --tc-surface-color: var(--md-sys-color-surface-container);
                --tc-on-surface-color: var(--md-sys-color-on-surface);
                --tc-surface-container-color: var(--md-sys-color-surface-container-highest);
                --tc-outline-color: var(--md-sys-color-outline);
                --tc-outline-variant-color: var(--md-sys-color-outline-variant);
                --tc-primary-color: var(--md-sys-color-primary);

                /* Secondary */
                --tc-secondary-surface-color: var(--md-sys-color-secondary-container);
                --tc-secondary-on-surface-color: var(--md-sys-color-on-secondary-container);
                --tc-secondary-surface-container-color: var(--md-sys-color-secondary-container);
                --tc-secondary-outline-color: var(--md-sys-color-outline);
                --tc-secondary-color: var(--md-sys-color-secondary);

                /* Tertiary */
                --tc-tertiary-surface-color: var(--md-sys-color-tertiary-container);
                --tc-tertiary-on-surface-color: var(--md-sys-color-on-tertiary-container);
                --tc-tertiary-surface-container-color: var(--md-sys-color-tertiary-container);
                --tc-tertiary-outline-color: var(--md-sys-color-outline);
                --tc-tertiary-color: var(--md-sys-color-tertiary);
            }

            .place-holder {
                color: var(--md-sys-color-on-surface);
                opacity: 0.5;
            }
        `;
    }

    protected override render(): TemplateResult {
        if(!this.papyros.debugger.active) {
            return html`<div class="place-holder">${this.t("Papyros.debug_placeholder")}</div>`;
        }

        return html`<tc-trace 
                .trace=${this.papyros.debugger.trace}
                .translations=${this.papyros.i18n.getTranslations("Papyros.debugger")}
                @frame-change=${(e: CustomEvent) => {
        this.papyros.debugger.activeFrame = e.detail.frame;
    }
}
        ></tc-trace>`;
    }
}