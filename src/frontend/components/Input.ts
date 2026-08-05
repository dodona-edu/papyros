import { customElement } from "lit/decorators.js";
import { css, CSSResult, html, TemplateResult } from "lit";
import "./input/BatchInput";
import "./input/InteractiveInput";
import { PapyrosElement } from "./PapyrosElement";
import "@material/web/labs/segmentedbuttonset/outlined-segmented-button-set";
import "@material/web/labs/segmentedbutton/outlined-segmented-button";
import { InputMode } from "../state/InputOutput";

@customElement("p-input")
export class Input extends PapyrosElement {
    static get styles(): CSSResult {
        return css`
            :host {
                width: 100%;
                height: fit-content;
                display: block;
            }

            p-batch-input {
                height: 200px;
            }

            md-outlined-segmented-button-set {
                margin-top: 0.5rem;
                --md-outlined-segmented-button-selected-container-color: var(--md-sys-color-primary-container);
                --md-outlined-segmented-button-selected-label-text-color: var(--md-sys-color-on-primary-container);
                --md-outlined-segmented-button-selected-hover-label-text-color: var(
                    --md-sys-color-on-primary-container
                );
                --md-outlined-segmented-button-selected-focus-label-text-color: var(
                    --md-sys-color-on-primary-container
                );
                --md-outlined-segmented-button-selected-pressed-label-text-color: var(
                    --md-sys-color-on-primary-container
                );
            }
        `;
    }

    get mode(): InputMode {
        return this.papyros.io.inputMode;
    }

    private selectMode(e: CustomEvent<{ index: number; selected: boolean }>): void {
        if (!e.detail.selected) return;
        this.papyros.io.inputMode = e.detail.index === 0 ? InputMode.interactive : InputMode.batch;
    }

    protected override render(): TemplateResult {
        return html`
            ${
                this.mode === InputMode.batch
                    ? html`<p-batch-input .papyros=${this.papyros}></p-batch-input>`
                    : html`<p-interactive-input .papyros=${this.papyros}></p-interactive-input>`
            }
            <md-outlined-segmented-button-set @segmented-button-set-selection=${this.selectMode}>
                <md-outlined-segmented-button
                    no-checkmark
                    label=${this.t("Papyros.input_modes.interactive")}
                    ?selected=${this.mode === InputMode.interactive}
                ></md-outlined-segmented-button>
                <md-outlined-segmented-button
                    no-checkmark
                    label=${this.t("Papyros.input_modes.batch")}
                    ?selected=${this.mode === InputMode.batch}
                ></md-outlined-segmented-button>
            </md-outlined-segmented-button-set>
        `;
    }
}
