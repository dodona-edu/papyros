import {html, LitElement, TemplateResult} from "lit";
import {customElement, property} from "lit/decorators.js";
import {t} from "../../util/Util";
import {Papyros, papyros} from "../../state/Papyros";


@customElement('p-stop-debug-button')
export class StopButton extends LitElement {
    @property
    papyros: Papyros = papyros;

    protected override render(): TemplateResult {
        return html`
            <button>
                ${this.papyros.theme.icons.stopDebug}
                ${t(`Papyros.debug.stop`)}
                @click=${() => this.papyros.debug.active = false}
            </button>
        `
    }
}