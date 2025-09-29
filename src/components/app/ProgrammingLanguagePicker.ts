import { customElement } from "lit/decorators.js";
import { PapyrosElement } from "../extras/PapyrosElement";
import { html, TemplateResult } from "lit";
import { ProgrammingLanguage } from "../../ProgrammingLanguage";
import "@material/web/select/outlined-select";
import "@material/web/select/select-option";
import { RunState } from "../../state/Runner";

@customElement("p-programming-language-picker")
export class ProgrammingLanguagePicker extends PapyrosElement {
    protected override render(): TemplateResult {
        return html`
            <md-outlined-select
                    ?disabled=${this.papyros.runner.state !== RunState.Ready || this.papyros.debugger.active}
                    label=${this.t("Papyros.programming_language")}
                    @input=${(e: InputEvent) => {
        this.papyros.runner.programmingLanguage = (e.target as HTMLInputElement).value as ProgrammingLanguage;
    }}>
                ${Object.values(ProgrammingLanguage).map(lang => html`
                                    <md-select-option
                                        value=${lang}
                                        ?selected=${this.papyros.runner.programmingLanguage === lang}
                                    >
                                        <div slot="headline">${lang}</div>
                                    </md-select-option>
                                `)}
            </md-outlined-select>
        `;
    }
}