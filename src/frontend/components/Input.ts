import { customElement } from "lit/decorators.js";
import { css, CSSResult, html, PropertyValues, TemplateResult } from "lit";
import "./input/BatchInput";
import "./input/InteractiveInput";
import { PapyrosElement } from "./PapyrosElement";
import { paneLabelStyles, tabBarStyles, tabButtonStyles } from "./shared-styles";
import { HeightTransition } from "./motion";
import { InputMode } from "../state/InputOutput";
import { nextTabIndex } from "./tabs";

const MODES = [InputMode.interactive, InputMode.batch];

@customElement("p-input")
export class Input extends PapyrosElement {
    static get styles(): CSSResult {
        return css`
            :host {
                width: 100%;
                display: flex;
                flex-direction: column;
                min-height: 0;
                border: 1px solid var(--md-sys-color-outline-variant);
                border-radius: 0.625rem;
                background-color: var(--md-sys-color-surface);
                overflow: hidden;
                box-sizing: border-box;
                container: papyros-input / inline-size;
                --md-outlined-text-field-outline-color: var(--md-sys-color-outline-variant);
                --md-outlined-button-outline-color: var(--md-sys-color-outline-variant);
            }

            ${tabBarStyles}
            ${tabButtonStyles}
            ${paneLabelStyles}

            .content {
                display: flex;
                flex-direction: column;
                /* Shrinkable, so a tight column takes height from the input box before
                   it takes it from the output above. */
                flex: 0 1 auto;
                min-height: 0;
                padding: 0.75rem 0.875rem;
            }

            .content.interactive {
                padding: 0.5rem 0.625rem;
            }

            p-batch-input {
                flex: 0 1 12.5rem;
                min-height: 4rem;
            }
        `;
    }

    /** The two modes are very different heights, so the pane resizes into the new one. */
    private heightTransition = new HeightTransition(this);
    private renderedMode: InputMode | undefined = undefined;

    get mode(): InputMode {
        return this.papyros.io.inputMode;
    }

    protected override willUpdate(changedProperties: PropertyValues): void {
        super.willUpdate(changedProperties);
        // Only the mode swap changes the height; the other renders here are input state.
        if (this.renderedMode !== undefined && this.renderedMode !== this.mode) {
            this.heightTransition.capture();
        }
        this.renderedMode = this.mode;
    }

    protected override updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        void this.heightTransition.play();
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.heightTransition.cancel();
    }

    private selectMode(mode: InputMode): void {
        this.papyros.io.inputMode = mode;
    }

    /** Standard ARIA tabs pattern: arrow keys move focus and select in one step. */
    private handleTabsKeydown(e: KeyboardEvent): void {
        const nextIndex = nextTabIndex(e.key, MODES.indexOf(this.mode), MODES.length);
        if (nextIndex === undefined) return;
        e.preventDefault();
        const nextMode = MODES[nextIndex];
        this.selectMode(nextMode);
        void this.updateComplete.then(() => {
            this.renderRoot.querySelector<HTMLElement>(`#tab-${nextMode}`)?.focus();
        });
    }

    private renderTab(mode: InputMode): TemplateResult {
        return html`
            <button
                id="tab-${mode}"
                role="tab"
                aria-selected=${this.mode === mode}
                aria-controls="input-panel"
                tabindex=${this.mode === mode ? 0 : -1}
                class=${this.mode === mode ? "active" : ""}
                @click=${() => this.selectMode(mode)}
            >
                ${this.t(`Papyros.input_modes.${mode}`)}
            </button>
        `;
    }

    protected override render(): TemplateResult {
        return html`
            <div class="tab-bar">
                <span class="pane-label">${this.t("Papyros.input")}</span>
                <!-- A tablist may only contain tabs, so the pane label sits outside it. -->
                <div
                    class="tablist"
                    role="tablist"
                    aria-label=${this.t("Papyros.input_tabs")}
                    @keydown=${this.handleTabsKeydown}
                >
                    ${MODES.map((mode) => this.renderTab(mode))}
                </div>
            </div>
            <div class="content ${this.mode}" id="input-panel" role="tabpanel" aria-labelledby="tab-${this.mode}">
                ${
                    this.mode === InputMode.batch
                        ? html`<p-batch-input .papyros=${this.papyros}></p-batch-input>`
                        : html`<p-interactive-input .papyros=${this.papyros}></p-interactive-input>`
                }
            </div>
        `;
    }
}
