import { css, CSSResult, html, PropertyValues, TemplateResult } from "lit";
import "@dodona/trace-component";
import { customElement } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { fadeIn } from "./motion";

@customElement("p-debugger")
export class Debugger extends PapyrosElement {
    static override get styles(): CSSResult {
        return css`
            :host {
                display: block;
                height: 100%;

                /* Base / surface */
                --tc-surface-color: var(--md-sys-color-surface-container);
                --tc-on-surface-color: var(--md-sys-color-on-surface);
                --tc-surface-container-color: var(--md-sys-color-surface-container-highest);
                --tc-outline-color: var(--md-sys-color-outline);
                --tc-outline-variant-color: var(--md-sys-color-outline-variant);
                --tc-primary-color: var(--md-sys-color-primary);

                /* Secondary */
                --tc-secondary-surface-color: var(
                    --md-sys-color-secondary-surface,
                    var(--md-sys-color-secondary-container)
                );
                --tc-secondary-on-surface-color: var(
                    --md-sys-color-on-secondary-surface,
                    var(--md-sys-color-on-secondary-container)
                );
                --tc-secondary-surface-container-color: var(--md-sys-color-secondary-container);
                --tc-secondary-outline-color: var(--md-sys-color-secondary-outline, var(--md-sys-color-outline));
                --tc-secondary-color: var(--md-sys-color-secondary);

                /* Tertiary */
                --tc-tertiary-surface-color: var(
                    --md-sys-color-tertiary-surface,
                    var(--md-sys-color-tertiary-container)
                );
                --tc-tertiary-on-surface-color: var(
                    --md-sys-color-on-tertiary-surface,
                    var(--md-sys-color-on-tertiary-container)
                );
                --tc-tertiary-surface-container-color: var(--md-sys-color-tertiary-container);
                --tc-tertiary-outline-color: var(--md-sys-color-tertiary-outline, var(--md-sys-color-outline));
                --tc-tertiary-color: var(--md-sys-color-tertiary);
            }

            .place-holder {
                color: var(--md-sys-color-on-surface-variant);
            }

            .scroll-region {
                height: 100%;
                overflow: auto;
            }
        `;
    }

    private hadTrace: boolean | undefined = undefined;

    /**
     * The pane is the same size either way, so the swap between the placeholder and the
     * trace is easy to miss. A fade points at the thing that just answered the run.
     */
    protected override updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        const hasTrace = this.hasTrace;
        if (this.hadTrace !== undefined && this.hadTrace !== hasTrace) {
            const region = this.renderRoot.querySelector<HTMLElement>(".scroll-region");
            if (region) fadeIn(region);
        }
        this.hadTrace = hasTrace;
    }

    private get hasTrace(): boolean {
        return this.papyros.debugger.active && this.papyros.debugger.trace.length > 0;
    }

    protected override render(): TemplateResult {
        const hasTrace = this.hasTrace;
        return html`
            <div class="scroll-region" role="region" tabindex="0" aria-label=${this.t("Papyros.debugger.title")}>
                ${
                    hasTrace
                        ? html`<tc-trace
                              .trace=${this.papyros.debugger.trace}
                              .translations=${this.papyros.i18n.getTranslations("Papyros.debugger")}
                              .selectedFrame=${this.papyros.debugger.activeFrame ?? 0}
                              @frame-change=${(e: CustomEvent) => {
                                  this.papyros.debugger.activeFrame = e.detail.frame;
                              }}
                          ></tc-trace>`
                        : html`<div class="place-holder">${this.t("Papyros.debug_placeholder")}</div>`
                }
            </div>
        `;
    }
}
