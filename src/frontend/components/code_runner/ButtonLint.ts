import { customElement, property, state } from "lit/decorators.js";
import { css, CSSResult, html, nothing, PropertyValues, TemplateResult } from "lit";
import { createRef, Ref, ref } from "lit/directives/ref.js";
import { RunState } from "../../state/Runner";
import { PapyrosElement } from "../PapyrosElement";
import { RunMode } from "../../../backend/Backend";
import "@material/web/button/filled-button";
import "@material/web/button/outlined-button";
import "@material/web/iconbutton/filled-icon-button";
import "@material/web/iconbutton/outlined-icon-button";

/**
 * Which button set is currently rendered. Distinct from RunState: several
 * states (e.g. Running, Loading) all render the same single Stop button.
 */
type ButtonSet = "run" | "stop" | "stop-debugging";

type ButtonSpec = {
    filled: boolean;
    icon: TemplateResult;
    label: string;
    disabled: boolean;
    onClick: () => void;
};

@customElement("p-button-lint")
export class ButtonLint extends PapyrosElement {
    /** Whether the host put anything in the default slot, which is what the divider separates. */
    @state()
    private hasSlotted = false;

    /** Shows the run buttons as icon buttons. They always are below 30rem of code runner width. */
    @property({ type: Boolean, reflect: true })
    compact = false;

    static get styles(): CSSResult {
        return css`
            /* A toolbar row of 44px with the hairline of the tab bar next to it, so the two
               read as one bar, and as two stacked bars once a narrow column wraps them.
               It never wraps itself, so the divider cannot end a row: the buttons turn
               into icon buttons instead. */
            :host {
                position: relative;
                overflow: clip;
                display: flex;
                align-items: center;
                min-height: 2.75rem;
                box-sizing: border-box;
                padding: 0.375rem 0.5rem;
                gap: 0.5rem;
                box-shadow: inset 0 -1px 0 var(--md-sys-color-outline-variant);
                background-color: var(--md-sys-color-surface);
                --md-filled-button-container-height: 2rem;
                --md-outlined-button-container-height: 2rem;
                --md-filled-button-with-leading-icon-leading-space: 0.75rem;
                --md-filled-button-with-leading-icon-trailing-space: 1rem;
                --md-outlined-button-with-leading-icon-leading-space: 0.75rem;
                --md-outlined-button-with-leading-icon-trailing-space: 1rem;
                --md-outlined-button-outline-color: var(--md-sys-color-outline-variant);
                --md-filled-icon-button-container-width: 2rem;
                --md-filled-icon-button-container-height: 2rem;
                --md-filled-icon-button-icon-size: 1.125rem;
                --md-outlined-icon-button-container-width: 2rem;
                --md-outlined-icon-button-container-height: 2rem;
                --md-outlined-icon-button-icon-size: 1.125rem;
                --md-outlined-icon-button-outline-color: var(--md-sys-color-outline-variant);
            }

            .buttons {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            /* The form that is not shown keeps its size, so the code runner can measure both. */
            .narrow,
            :host([compact]) .wide {
                position: absolute;
                top: 0;
                left: 0;
                width: max-content;
                visibility: hidden;
            }

            :host([compact]) .narrow {
                position: static;
                width: auto;
                visibility: visible;
            }

            @container papyros-code-runner (width < 30rem) {
                .wide {
                    position: absolute;
                    width: max-content;
                    visibility: hidden;
                }

                .narrow {
                    position: static;
                    width: auto;
                    visibility: visible;
                }
            }

            .divider {
                width: 1px;
                height: 1.25rem;
                background-color: var(--md-sys-color-outline-variant);
            }

            [hidden] {
                display: none;
            }
        `;
    }

    /**
     * The first (primary) button of the currently rendered set, in its labelled and
     * its icon form, so focus can follow whichever is shown when that set changes.
     */
    private firstButtonRef: Ref<HTMLElement> = createRef();
    private firstIconButtonRef: Ref<HTMLElement> = createRef();
    private renderedSet: ButtonSet | undefined = undefined;
    /**
     * Whether focus was inside this component right before the button set
     * changes, so the successor button is only focused when a keyboard user
     * was actually driving this component, never when e.g. typing elsewhere.
     */
    private shouldRefocus = false;

    private get buttonSet(): ButtonSet {
        const state = this.papyros.runner.state;
        if (state === RunState.Ready || state === RunState.Error) {
            return this.papyros.debugger.active ? "stop-debugging" : "run";
        }
        return "stop";
    }

    protected override willUpdate(changedProperties: PropertyValues): void {
        super.willUpdate(changedProperties);
        const newSet = this.buttonSet;
        const focusWasInside = this.shadowRoot?.activeElement != null;
        this.shouldRefocus = focusWasInside && newSet !== this.renderedSet;
        this.renderedSet = newSet;
    }

    protected override updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        if (this.shouldRefocus) {
            // The button set was just (re)created: a freshly minted md-* element has
            // not rendered its own focusable internals yet. Its own render is queued
            // as a microtask, which is guaranteed to flush before the next frame.
            requestAnimationFrame(() => {
                // A render in between can have replaced the button, so take the current one.
                const button = [this.firstButtonRef.value, this.firstIconButtonRef.value].find(
                    (b) => b?.isConnected && b.checkVisibility({ visibilityProperty: true }),
                );
                button?.focus();
            });
        }
    }

    private get buttonSpecs(): ButtonSpec[] {
        const state = this.papyros.runner.state;
        if (state === RunState.Ready || state === RunState.Error) {
            // Without a backend there is nothing to run or stop, so the run
            // controls stay in place but inert
            const disabled = state === RunState.Error;
            if (this.papyros.debugger.active) {
                return [
                    {
                        filled: false,
                        icon: this.papyros.constants.icons.stopDebug,
                        label: this.t("Papyros.debug.stop"),
                        disabled: false,
                        onClick: () => (this.papyros.debugger.active = false),
                    },
                ];
            }
            return [RunMode.Run, ...this.papyros.runner.runModes].map((mode, i) => ({
                filled: i === 0,
                icon: this.papyros.constants.icons[mode],
                label: this.t(`Papyros.run_modes.${mode}`),
                disabled,
                onClick: () => void this.papyros.runner.start(mode),
            }));
        }
        return [
            {
                filled: true,
                icon: this.papyros.constants.icons.stop,
                label: this.t("Papyros.stop"),
                disabled: false,
                onClick: () => void this.papyros.runner.stop(),
            },
        ];
    }

    private renderButton(spec: ButtonSpec, first: boolean): TemplateResult {
        const wideRef = first ? ref(this.firstButtonRef) : nothing;
        const icon = html`<span slot="icon">${spec.icon}</span>`;
        return spec.filled
            ? html`<md-filled-button ${wideRef} ?disabled=${spec.disabled} @click=${spec.onClick}>
                  ${icon}${spec.label}
              </md-filled-button>`
            : html`<md-outlined-button ${wideRef} ?disabled=${spec.disabled} @click=${spec.onClick}>
                  ${icon}${spec.label}
              </md-outlined-button>`;
    }

    private renderIconButton(spec: ButtonSpec, first: boolean): TemplateResult {
        const narrowRef = first ? ref(this.firstIconButtonRef) : nothing;
        return spec.filled
            ? html`<md-filled-icon-button
                  ${narrowRef}
                  aria-label=${spec.label}
                  title=${spec.label}
                  ?disabled=${spec.disabled}
                  @click=${spec.onClick}
              >
                  ${spec.icon}
              </md-filled-icon-button>`
            : html`<md-outlined-icon-button
                  ${narrowRef}
                  aria-label=${spec.label}
                  title=${spec.label}
                  ?disabled=${spec.disabled}
                  @click=${spec.onClick}
              >
                  ${spec.icon}
              </md-outlined-icon-button>`;
    }

    private wideRef: Ref<HTMLElement> = createRef();
    private narrowRef: Ref<HTMLElement> = createRef();
    private slottedRef: Ref<HTMLElement> = createRef();
    private resizeObserver = new ResizeObserver(() => this.dispatchEvent(new Event("p-button-lint-resize")));

    /** The width of the slotted buttons as they are laid out now, or undefined while they are hidden. */
    public get slottedWidth(): number | undefined {
        const slotted = this.slottedRef.value;
        return slotted && !slotted.hidden ? slotted.offsetWidth : undefined;
    }

    /** The width this row needs with labelled or icon run buttons and slotted buttons of the given width. */
    public neededWidth(compact: boolean, slottedWidth: number | undefined): number {
        const buttons = (compact ? this.narrowRef : this.wideRef).value;
        if (!buttons) return 0;
        const style = getComputedStyle(this);
        const gap = parseFloat(style.columnGap) || 0;
        let width = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + buttons.offsetWidth;
        if (slottedWidth !== undefined) width += 2 * gap + 1 + slottedWidth;
        return Math.ceil(width);
    }

    override connectedCallback(): void {
        super.connectedCallback();
        void this.updateComplete.then(() => this.observeSizes());
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.resizeObserver.disconnect();
    }

    private observeSizes(): void {
        this.resizeObserver.disconnect();
        for (const element of [this.wideRef.value, this.narrowRef.value, this.slottedRef.value]) {
            if (element) this.resizeObserver.observe(element);
        }
    }

    private onSlotChange(e: Event): void {
        this.hasSlotted = (e.target as HTMLSlotElement).assignedElements({ flatten: true }).length > 0;
    }

    protected override render(): TemplateResult {
        // While debugging, Stop debugging is the only button in the row.
        const showSlotted = this.hasSlotted && !this.papyros.debugger.active;
        const specs = this.buttonSpecs;
        return html`
            <div class="buttons wide" ${ref(this.wideRef)}>
                ${specs.map((spec, i) => this.renderButton(spec, i === 0))}
            </div>
            <div class="buttons narrow" ${ref(this.narrowRef)}>
                ${specs.map((spec, i) => this.renderIconButton(spec, i === 0))}
            </div>
            <span class="divider" aria-hidden="true" ?hidden=${!showSlotted}></span>
            <div class="buttons" ${ref(this.slottedRef)} ?hidden=${!showSlotted}>
                <slot @slotchange=${this.onSlotChange}></slot>
            </div>
        `;
    }
}
