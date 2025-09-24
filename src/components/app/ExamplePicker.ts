import {customElement} from "lit/decorators.js";
import {PapyrosElement} from "../extras/PapyrosElement";
import {html} from "lit";
import "@material/web/select/outlined-select";
import "@material/web/select/select-option";
import {RunState} from "../../state/Runner";
import {t} from "../../util/Util";

@customElement('p-example-picker')
export class ExamplePicker extends PapyrosElement {
    protected override render() {
        return html`
            <md-outlined-select
                    ?disabled=${this.papyros.runner.state !== RunState.Ready || this.papyros.debugger.active}
                    label=${t('Papyros.examples')}
                    @input=${(e: InputEvent) => {
                this.papyros.runner.code = this.papyros.examples.getExampleCode((e.target as HTMLInputElement).value);
            }}>
                ${this.papyros.examples.names.map(name => html`
                                    <md-select-option value=${name}>
                                        <div slot="headline">${name}</div>
                                    </md-select-option>
                                `)}
            </md-outlined-select>
        `;
    }
}