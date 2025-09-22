import {html, LitElement, TemplateResult} from "lit";
import {RunMode} from "../../Backend";
import {customElement, property} from "lit/decorators.js";
import {t} from "../../util/Util";
import {Papyros} from "../../state/Papyros";
import {papyros} from "../../state/Papyros";
import {StateController} from "@dodona/lit-state";

@customElement('p-run-button')
export class RunButton extends LitElement {
    controller = new StateController(this);
    @property({ type: String })
    mode: RunMode = RunMode.Run;
    @property()
    papyros: Papyros = papyros;

    protected override render(): TemplateResult {
        return html`
            <button @click=${() => this.papyros.runner.start(this.mode)}>
                ${this.papyros.theme.icons[this.mode]}
                ${t(`Papyros.run_modes.${this.mode}`)}
            </button>
        `
    }
}