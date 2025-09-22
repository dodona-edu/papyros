import {html, LitElement, TemplateResult} from "lit";
import {customElement, property} from "lit/decorators.js";
import {t} from "../../util/Util";
import {Papyros, papyros} from "../../state/Papyros";
import {StateController} from "@dodona/lit-state";


@customElement('p-stop-debug-button')
export class StopDebugButton extends LitElement {
    controller = new StateController(this);
    @property()
    papyros: Papyros = papyros;

    protected override render(): TemplateResult {
        return html`
            <button @click=${() => this.papyros.debugger.active = false}>
                ${this.papyros.theme.icons.stopDebug}
                ${t(`Papyros.debug.stop`)}
            </button>
        `
    }
}