import {customElement, property} from "lit/decorators.js";
import {css, html, TemplateResult} from "lit";
import {t} from "../util/Util";
import "./input/BatchInput";
import "./input/InteractiveInput";
import {PapyrosElement} from "./extras/PapyrosElement";
import "@material/web/switch/switch";

enum InputMode {
    batch = "batch",
    interactive = "interactive",
}

@customElement('p-input')
export class Input extends PapyrosElement {
    @property({state: true})
    mode: InputMode = InputMode.interactive;
    static get styles() {
        return css`
            label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0.5rem;
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
                ${t(`Papyros.switch_input_mode_to.${this.otherMode}`)}
            </label>
        `;
    }
}