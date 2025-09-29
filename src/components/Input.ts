import { customElement, property } from "lit/decorators.js";
import { css, html, TemplateResult } from "lit";
import "./input/BatchInput";
import "./input/InteractiveInput";
import { PapyrosElement } from "./extras/PapyrosElement";
import "@material/web/switch/switch";
import { CSSResultGroup } from "@lit/reactive-element/css-tag.js";

enum InputMode {
    batch = "batch",
    interactive = "interactive",
}

@customElement("p-input")
export class Input extends PapyrosElement {
    @property({ state: true })
        mode: InputMode = InputMode.interactive;
    static get styles(): CSSResultGroup {
        return css`
            label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0.5rem;
            }

            :host {
                width: 100%;
                height: fit-content;
                display: block;
            }
            
            p-batch-input {
                height: 200px;
            }
        `
    }

    get otherMode(): InputMode {
        return this.mode === InputMode.batch ? InputMode.interactive : InputMode.batch;
    }

    toggleMode(): void {
        this.mode = this.otherMode;
    }

    protected override render(): TemplateResult {
        if (this.papyros.debugger.active) {
            this.mode = InputMode.batch;
        }

        return html`
            ${this.mode === InputMode.batch ? 
        html`<p-batch-input .papyros=${this.papyros}></p-batch-input>` : 
        html`<p-interactive-input .papyros=${this.papyros}></p-interactive-input>`}
            <label>
                <md-switch .selected=${this.mode === InputMode.batch}
                           ?disabled=${this.papyros.debugger.active}
                           @change=${() => this.toggleMode()}></md-switch>
                ${this.t(`Papyros.switch_input_mode_to.${this.otherMode}`)}
            </label>
        `;
    }
}