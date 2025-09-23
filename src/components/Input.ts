import {customElement, property} from "lit/decorators.js";
import {html, TemplateResult} from "lit";
import {t} from "../util/Util";
import "./input/BatchInput";
import "./input/InteractiveInput";
import {PapyrosElement} from "./helpers/PapyrosElement";

enum InputMode {
    batch = "batch",
    interactive = "interactive",
}

@customElement('p-input')
export class Input extends PapyrosElement {
    @property({state: true})
    mode: InputMode = InputMode.interactive;

    get activeMode(): InputMode {
        if(this.papyros.debugger.active) {
            return InputMode.batch;
        }
        return this.mode;
    }

    get otherMode(): InputMode {
        return this.activeMode === InputMode.batch ? InputMode.interactive : InputMode.batch;
    }

    toggleMode(): void {
        this.mode = this.otherMode;
    }

    protected override render(): TemplateResult {
        return html`
            ${this.activeMode === InputMode.batch ? 
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