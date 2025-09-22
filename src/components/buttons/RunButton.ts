import {html, LitElement, TemplateResult} from "lit";
import {RunMode} from "../../Backend";
import {customElement, property} from "lit/decorators.js";
import {t} from "../../util/Util";
import {Papyros} from "../../state/Papyros";
import {papyros} from "../../state/Papyros";
import {RunState} from "../../state/Runner";

@customElement('p-run-button')
export class RunButton extends LitElement {
    @property({ type: String })
    mode: RunMode = RunMode.Run;
    @property
    papyros: Papyros = papyros;

    protected override render(): TemplateResult {
        return html`
            <button>
                ${this.papyros.theme.icons[this.mode]}
                ${t(`Papyros.run_modes.${this.mode}`)}
                @click=${() => this.papyros.runner.start(this.mode)}
            </button>
        `
    }
}