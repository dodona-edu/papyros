import {html, TemplateResult} from "lit";
import {customElement} from "lit/decorators.js";
import {t} from "../../util/Util";
import {PapyrosElement} from "../helpers/PapyrosElement";


@customElement('p-stop-button')
export class StopButton extends PapyrosElement {
    protected override render(): TemplateResult {
        return html`
            <button @click=${() => this.papyros.runner.stop()}>
                ${this.papyros.theme.icons.stop}
                ${t(`Papyros.stop`)}
            </button>
        `
    }
}