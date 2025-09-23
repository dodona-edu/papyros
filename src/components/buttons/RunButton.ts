import {html, TemplateResult} from "lit";
import {RunMode} from "../../Backend";
import {customElement, property} from "lit/decorators.js";
import {t} from "../../util/Util";
import {PapyrosElement} from "../helpers/PapyrosElement";

@customElement('p-run-button')
export class RunButton extends PapyrosElement {
    @property({ type: String })
    mode: RunMode = RunMode.Run;

    protected override render(): TemplateResult {
        return html`
            <button @click=${() => this.papyros.runner.start(this.mode)}>
                ${this.papyros.theme.icons[this.mode]}
                ${t(`Papyros.run_modes.${this.mode}`)}
            </button>
        `
    }
}