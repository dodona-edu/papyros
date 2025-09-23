import {html, TemplateResult} from "lit";
import {customElement} from "lit/decorators.js";
import {t} from "../../util/Util";
import {PapyrosElement} from "../helpers/PapyrosElement";


@customElement('p-stop-debug-button')
export class StopDebugButton extends PapyrosElement {
    protected override render(): TemplateResult {
        return html`
            <button @click=${() => this.papyros.debugger.active = false}>
                ${this.papyros.theme.icons.stopDebug}
                ${t(`Papyros.debug.stop`)}
            </button>
        `
    }
}