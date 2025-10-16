import { customElement } from "lit/decorators.js";
import { css, CSSResult, html, TemplateResult } from "lit";
import "./input/BatchInput";
import "./input/InteractiveInput";
import { PapyrosElement } from "./PapyrosElement";
import "@material/web/switch/switch";
import { InputMode } from "../state/InputOutput";

@customElement("p-input")
export class Input extends PapyrosElement {
    static get styles(): CSSResult {
        return css`
            label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0.5rem;
            }
            
            :host{
                display: flex;
                flex-direction: column;
            }
            
            p-batch-input {
                flex: 1;
                min-height: 0;
                overflow: auto;
            }
        `
    }

    get mode(): InputMode {
        return this.papyros.io.inputMode;
    }

    get otherMode(): InputMode {
        return this.mode === InputMode.batch ? InputMode.interactive : InputMode.batch;
    }

    toggleMode(): void {
        this.papyros.io.inputMode = this.otherMode;
    }

    protected override render(): TemplateResult {
        return html`
            ${this.mode === InputMode.batch ? 
        html`<p-batch-input .papyros=${this.papyros}></p-batch-input>` : 
        html`<p-interactive-input .papyros=${this.papyros}></p-interactive-input>`}
            <label>
                <md-switch .selected=${this.mode === InputMode.batch}
                           @change=${() => this.toggleMode()}></md-switch>
                ${this.t(`Papyros.switch_input_mode_to.${this.otherMode}`)}
            </label>
        `;
    }
}