import { customElement } from "lit/decorators.js";
import { PapyrosElement } from "../extras/PapyrosElement";
import { html, TemplateResult } from "lit";
import "@material/web/select/outlined-select";
import "@material/web/select/select-option";

@customElement("p-language-picker")
export class LanguagePicker extends PapyrosElement {
    protected override render(): TemplateResult {
        return html`
            <md-outlined-select
                    @input=${(e: InputEvent) => {
        this.papyros.i18n.locale = (e.target as HTMLInputElement).value;
    }}>
                ${this.papyros.i18n.availableLocales.map(lang => html`
                                    <md-select-option
                                        value=${lang}
                                        ?selected=${this.papyros.i18n.locale === lang}
                                    >
                                        <div slot="headline">${this.t(`Papyros.locales.${lang}`)}</div>
                                    </md-select-option>
                                `)}
            </md-outlined-select>
        `;
    }
}