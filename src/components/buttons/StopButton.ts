import {html, LitElement, TemplateResult} from "lit";
import {customElement, property} from "lit/decorators.js";
import {t} from "../../util/Util";
import {Papyros, papyros} from "../../state/Papyros";
import {StateController} from "@dodona/lit-state";


@customElement('p-stop-button')
export class StopButton extends LitElement {
    controller = new StateController(this);
    @property()
    papyros: Papyros = papyros;

    protected override render(): TemplateResult {
        return html`
            <button @click=${() => this.papyros.runner.stop()}>
                ${this.papyros.theme.icons.stop}
                ${t(`Papyros.stop`)}
            </button>
        `
    }
}