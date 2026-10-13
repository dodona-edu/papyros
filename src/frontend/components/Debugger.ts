import { css, CSSResult, html, PropertyValues, TemplateResult } from "lit";
import "@dodona/trace-component";
import "@material/web/icon/icon";
import "@material/web/iconbutton/icon-button";
import "@material/web/slider/slider";
import type { MdSlider } from "@material/web/slider/slider";
import { customElement } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { fadeIn } from "./motion";

@customElement("p-debugger")
export class Debugger extends PapyrosElement {
    static override get styles(): CSSResult {
        return css`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                min-height: 0;
                container-type: inline-size;

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

            .body {
                flex: 1;
                min-height: 0;
                display: flex;
                flex-direction: column;
            }

            tc-trace {
                flex: 1;
            }

            .place-holder {
                padding: 0.75rem 0.875rem;
                color: var(--md-sys-color-on-surface-variant);
            }

            /* The step controls form the header bar of the panel; the memory view below it scrolls. */
            .stepper {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.375rem;
                flex-shrink: 0;
                min-height: 2.75rem;
                padding: 0.25rem 0.625rem;
                box-sizing: border-box;
                border-bottom: 1px solid var(--md-sys-color-outline-variant);
                background-color: var(--md-sys-color-surface);
                color: var(--md-sys-color-on-surface);
                font-size: 0.875rem;
            }

            .stepper-label {
                margin-inline-end: 0.25rem;
                font-weight: 500;
            }

            .stepper md-icon-button {
                --md-icon-button-state-layer-width: 2rem;
                --md-icon-button-state-layer-height: 2rem;
                --md-icon-button-icon-size: 1.25rem;
                --md-icon-button-icon-color: var(--md-sys-color-primary);
                --md-icon-button-hover-icon-color: var(--md-sys-color-primary);
                --md-icon-button-focus-icon-color: var(--md-sys-color-primary);
                --md-icon-button-pressed-icon-color: var(--md-sys-color-primary);
            }

            .step-count {
                min-width: 4rem;
                text-align: center;
                font-variant-numeric: tabular-nums;
            }

            .stepper md-slider {
                flex: 1 1 5rem;
                min-inline-size: 5rem;
            }

            /* A phone sheet has no room for the label next to the slider. */
            @container (max-width: 24rem) {
                .stepper-label {
                    display: none;
                }
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
            const region = this.renderRoot.querySelector<HTMLElement>(".body");
            if (region) fadeIn(region);
        }
        this.hadTrace = hasTrace;
    }

    private get hasTrace(): boolean {
        return this.papyros.debugger.active && this.papyros.debugger.trace.length > 0;
    }

    private selectFrame(frame: number): void {
        this.papyros.debugger.activeFrame = frame;
    }

    /** Replaces the step picker of tc-trace, so the controls fit in one header bar. */
    private renderStepper(current: number): TemplateResult {
        const length = this.papyros.debugger.trace.length;
        const last = length - 1;
        const icons = this.papyros.constants.icons;
        const label = this.t("Papyros.debugger_step");
        return html`
            <div slot="picker" class="stepper" role="group" aria-labelledby="stepper-label">
                <!-- Names the group, and is hidden itself so it is not read a second time. -->
                <span class="stepper-label" id="stepper-label" aria-hidden="true">${label}</span>
                <md-icon-button
                    aria-label=${this.t("Papyros.debugger.first_step")}
                    ?soft-disabled=${current === 0}
                    @click=${() => this.selectFrame(0)}
                >
                    <md-icon>${icons.firstStep}</md-icon>
                </md-icon-button>
                <md-icon-button
                    aria-label=${this.t("Papyros.debugger.previous_step")}
                    ?soft-disabled=${current === 0}
                    @click=${() => this.selectFrame(current - 1)}
                >
                    <md-icon>${icons.previousStep}</md-icon>
                </md-icon-button>
                <output class="step-count" role="status" aria-label=${this.t("Papyros.debugger.current_step")}>
                    ${current + 1} / ${length}
                </output>
                <md-icon-button
                    aria-label=${this.t("Papyros.debugger.next_step")}
                    ?soft-disabled=${current === last}
                    @click=${() => this.selectFrame(current + 1)}
                >
                    <md-icon>${icons.nextStep}</md-icon>
                </md-icon-button>
                <md-icon-button
                    aria-label=${this.t("Papyros.debugger.last_step")}
                    ?soft-disabled=${current === last}
                    @click=${() => this.selectFrame(last)}
                >
                    <md-icon>${icons.lastStep}</md-icon>
                </md-icon-button>
                <md-slider
                    min="0"
                    max=${last}
                    .value=${current}
                    aria-label=${this.t("Papyros.debugger.slider_label")}
                    aria-valuetext=${this.t("Papyros.debugger.step_of", { step: current + 1, total: length })}
                    @input=${(e: Event) => this.selectFrame((e.target as MdSlider).value ?? 0)}
                ></md-slider>
            </div>
        `;
    }

    protected override render(): TemplateResult {
        const current = this.papyros.debugger.activeFrame ?? 0;
        return html`
            <div class="body">
                ${
                    this.hasTrace
                        ? html`<tc-trace
                              .trace=${this.papyros.debugger.trace}
                              .translations=${this.papyros.i18n.getTranslations("Papyros.debugger")}
                              .selectedFrame=${current}
                              @frame-change=${(e: CustomEvent) => this.selectFrame(e.detail.frame)}
                          >
                              ${this.renderStepper(current)}
                          </tc-trace>`
                        : html`<div class="place-holder">${this.t("Papyros.debug_placeholder")}</div>`
                }
            </div>
        `;
    }
}
