import { css, CSSResult, html, nothing, PropertyValues, TemplateResult } from "lit";
import "@dodona/trace-component";
import "@material/web/button/outlined-button";
import "@material/web/icon/icon";
import "@material/web/iconbutton/icon-button";
import "@material/web/progress/linear-progress";
import "@material/web/slider/slider";
import type { MdSlider } from "@material/web/slider/slider";
import { customElement } from "lit/decorators.js";
import { RunMode } from "../../backend/Backend";
import { RunState } from "../state/Runner";
import { PapyrosElement } from "./PapyrosElement";
import { fadeIn, prefersReducedMotion } from "./motion";

/** What the pane shows: an invitation to debug, a debug run that has no steps yet, or its trace. */
type View = "empty" | "starting" | "trace";

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

            /* Centred with auto margins rather than justify-content, so a pane shorter than
               the message scrolls it instead of cutting off its top. */
            .message {
                flex: 1;
                min-height: 0;
                overflow: auto;
                display: flex;
            }

            .message-content {
                margin: auto;
                padding: 0.5rem 1rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            .message-content md-icon {
                --md-icon-size: 3rem;
                margin-bottom: 0.5rem;
                color: var(--md-sys-color-outline);
            }

            .message-title {
                margin: 0;
                font-size: 1rem;
                font-weight: 500;
                color: var(--md-sys-color-on-surface);
            }

            .message-text {
                margin: 0.25rem 0 0;
                font-size: 0.875rem;
                color: var(--md-sys-color-on-surface-variant);
            }

            /* The same button as Debug in the code bar. */
            .message-content md-outlined-button {
                margin-top: 1rem;
                --md-outlined-button-container-height: 2rem;
                --md-outlined-button-with-leading-icon-leading-space: 0.75rem;
                --md-outlined-button-with-leading-icon-trailing-space: 1rem;
                --md-outlined-button-outline-color: var(--md-sys-color-outline-variant);
            }

            md-linear-progress {
                flex-shrink: 0;
                width: 100%;
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

    private renderedView: View | undefined = undefined;
    /** Whether this pane has shown a debug run, so its empty state can say that the debugger stopped. */
    private hasDebugged = false;
    /**
     * Whether focus was inside this pane right before the view changes, so focus only
     * follows into the new view when the user was working in the pane, never when
     * e.g. typing in the editor.
     */
    private shouldRefocus = false;

    protected override willUpdate(changedProperties: PropertyValues): void {
        super.willUpdate(changedProperties);
        if (this.papyros.debugger.active) this.hasDebugged = true;
        const focusWasInside = this.shadowRoot?.activeElement != null;
        this.shouldRefocus = focusWasInside && this.view !== this.renderedView;
    }

    /**
     * The pane is the same size in every view, so a swap between them is easy to miss.
     * A fade points at the thing that just answered the run.
     */
    protected override updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        const view = this.view;
        if (this.renderedView !== undefined && this.renderedView !== view) {
            const region = this.renderRoot.querySelector<HTMLElement>(".body");
            if (region) fadeIn(region);
        }
        this.renderedView = view;
        if (this.shouldRefocus) {
            // The view was just replaced, with the focused element in it: a freshly
            // minted md-* element renders its focusable internals a microtask later.
            requestAnimationFrame(() => this.focusView());
        }
    }

    /**
     * Focuses the first control of the current view: the first step button, the Debug
     * button, or the pane itself while a debug run has no steps yet.
     */
    private focusView(): void {
        const control = this.renderRoot.querySelector<HTMLElement>(".stepper md-icon-button, md-outlined-button");
        (control ?? this.renderRoot.querySelector<HTMLElement>(".body"))?.focus();
    }

    private get view(): View {
        const { active, trace } = this.papyros.debugger;
        if (active && trace.length > 0) return "trace";
        // A debug run that ended without a single step has nothing to prepare any more.
        const running = ![RunState.Ready, RunState.Error].includes(this.papyros.runner.state);
        return active && running ? "starting" : "empty";
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

    /** Invites a debug run, with the same Debug button as the code bar. */
    private renderEmpty(): TemplateResult {
        const icons = this.papyros.constants.icons;
        const runner = this.papyros.runner;
        return html`
            <div class="message">
                <div class="message-content">
                    <md-icon aria-hidden="true">${icons.bug}</md-icon>
                    <p class="message-title">
                        ${this.hasDebugged ? this.t("Papyros.debugger_stopped_title") : this.t("Papyros.debugger_empty_title")}
                    </p>
                    <p class="message-text">
                        ${this.hasDebugged ? this.t("Papyros.debugger_stopped_text") : this.t("Papyros.debugger_empty_text")}
                    </p>
                    ${
                        runner.runModes.includes(RunMode.Debug)
                            ? html`<md-outlined-button
                                  ?disabled=${!runner.canStart}
                                  @click=${() => void runner.start(RunMode.Debug)}
                              >
                                  <span slot="icon">${icons[RunMode.Debug]}</span>${this.t("Papyros.run_modes.debug")}
                              </md-outlined-button>`
                            : nothing
                    }
                </div>
            </div>
        `;
    }

    private renderStarting(): TemplateResult {
        const label = this.t("Papyros.debugger_preparing");
        // The indeterminate bar cannot be stilled from outside its shadow root, so it is
        // left out for people who ask for reduced motion, and the text names the state.
        const showProgress = !prefersReducedMotion();
        return html`
            ${
                showProgress
                    ? html`<md-linear-progress indeterminate aria-label=${label}></md-linear-progress>`
                    : nothing
            }
            <div class="message">
                <div class="message-content">
                    <!-- A progress bar is named after this text, so it is not read a second time. -->
                    <p class="message-text" aria-hidden=${showProgress ? "true" : nothing}>${label}</p>
                </div>
            </div>
        `;
    }

    private renderTrace(): TemplateResult {
        const current = this.papyros.debugger.activeFrame ?? 0;
        return html`<tc-trace
            .trace=${this.papyros.debugger.trace}
            .translations=${this.papyros.i18n.getTranslations("Papyros.debugger")}
            .selectedFrame=${current}
            @frame-change=${(e: CustomEvent) => this.selectFrame(e.detail.frame)}
        >
            ${this.renderStepper(current)}
        </tc-trace>`;
    }

    protected override render(): TemplateResult {
        const view = this.view;
        return html`
            <!-- Out of the tab order: it only holds focus while a view has no controls of its own. -->
            <div class="body" tabindex="-1">
                ${
                    view === "trace"
                        ? this.renderTrace()
                        : view === "starting"
                          ? this.renderStarting()
                          : this.renderEmpty()
                }
            </div>
        `;
    }
}
