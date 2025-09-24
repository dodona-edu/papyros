import {customElement, property} from "lit/decorators.js";
import {html, TemplateResult} from "lit";
import {t} from "../util/Util";
import "./input/BatchInput";
import "./input/InteractiveInput";
import {PapyrosElement} from "./extras/PapyrosElement";

enum InputMode {
    batch = "batch",
    interactive = "interactive",
}

@customElement('p-input')
export class Input extends PapyrosElement {
    @property({state: true})
    mode: InputMode = InputMode.interactive;

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
            ${ this.papyros.debugger.active ? html`` : html`
                <button @click=${() => this.toggleMode()}>
                    ${t(`Papyros.switch_input_mode_to.${this.otherMode}`)}
                </button>
            `}
        `;
    }
}