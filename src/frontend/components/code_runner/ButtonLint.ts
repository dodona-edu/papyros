import { customElement } from "lit/decorators.js";
import { css, CSSResult, html, PropertyValues, TemplateResult } from "lit";
import { createRef, Ref, ref } from "lit/directives/ref.js";
import { RunState } from "../../state/Runner";
import { PapyrosElement } from "../PapyrosElement";
import { RunMode } from "../../../backend/Backend";
import "@material/web/button/filled-button";
import "@material/web/button/outlined-button";

/**
 * Which button set is currently rendered. Distinct from RunState: several
 * states (e.g. Running, Loading) all render the same single Stop button.
 */
type ButtonSet = "run" | "stop" | "stop-debugging";

@customElement("p-button-lint")
export class ButtonLint extends PapyrosElement {
    static get styles(): CSSResult {
        return css`
            :host {
                display: flex;
                justify-content: space-between;
                height: fit-content;
                padding: 0.75rem 0 0;
                gap: 1rem;
                flex-wrap: wrap;
                --md-outlined-button-outline-color: var(--md-sys-color-outline-variant);
            }

            .buttons {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
        `;
    }

    /**
     * The first (primary) button of the currently rendered set, so focus can
     * follow it when that set changes.
     */
    private firstButtonRef: Ref<HTMLElement> = createRef();
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
                const button = this.firstButtonRef.value;
                if (button?.isConnected) button.focus();
            });
        }
    }

    get buttons(): TemplateResult | TemplateResult[] {
        const state = this.papyros.runner.state;
        if (state === RunState.Ready || state === RunState.Error) {
            // Without a backend there is nothing to run or stop, so the run
            // controls stay in place but inert
            const disabled = state === RunState.Error;
            if (this.papyros.debugger.active) {
                return html` <md-outlined-button
                    ${ref(this.firstButtonRef)}
                    @click=${() => (this.papyros.debugger.active = false)}
                >
                    <span slot="icon">${this.papyros.constants.icons.stopDebug}</span>
                    ${this.t("Papyros.debug.stop")}
                </md-outlined-button>`;
            } else {
                return [
                    html` <md-filled-button
                        ${ref(this.firstButtonRef)}
                        ?disabled=${disabled}
                        @click=${() => this.papyros.runner.start(RunMode.Run)}
                    >
                        <span slot="icon">${this.papyros.constants.icons[RunMode.Run]}</span>
                        ${this.t(`Papyros.run_modes.${RunMode.Run}`)}
                    </md-filled-button>`,
                    ...this.papyros.runner.runModes.map(
                        (mode) =>
                            html` <md-outlined-button
                                ?disabled=${disabled}
                                @click=${() => this.papyros.runner.start(mode)}
                            >
                                <span slot="icon">${this.papyros.constants.icons[mode]}</span>
                                ${this.t(`Papyros.run_modes.${mode}`)}
                            </md-outlined-button>`,
                    ),
                ];
            }
        } else {
            return html` <md-filled-button ${ref(this.firstButtonRef)} @click=${() => this.papyros.runner.stop()}>
                <span slot="icon">${this.papyros.constants.icons.stop}</span>
                ${this.t("Papyros.stop")}
            </md-filled-button>`;
        }
    }

    protected override render(): TemplateResult {
        return html`
            <div class="buttons">${this.buttons}</div>
            <div class="buttons"><slot></slot></div>
        `;
    }
}
