import {html, LitElement, TemplateResult} from "lit";
import {customElement, property} from "lit/decorators.js";
import {t} from "../../util/Util";
import {Papyros, papyros} from "../../state/Papyros";


@customElement('p-stop-button')
export class StopButton extends LitElement {
    @property
    papyros: Papyros = papyros;

    protected override render(): TemplateResult {
        return html`
            <button>
                ${this.papyros.theme.icons.stop}
                ${t(`Papyros.stop`)}
                @click=${() => this.papyros.runner.stop()}
            </button>
        `
    }
}