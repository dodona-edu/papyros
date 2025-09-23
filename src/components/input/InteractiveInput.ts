import {customElement, property} from "lit/decorators.js";
import {html, TemplateResult} from "lit";
import {t} from "../../util/Util";
import {PapyrosElement} from "../helpers/PapyrosElement";

@customElement("p-interactive-input")
export class InteractiveInput extends PapyrosElement {
    @property({state: true})
    value: string = '';

    provideInput(): void {
        this.papyros.io.provideInput(this.value);
        this.value = '';
    }

    protected override render(): TemplateResult {
        return html`
            <input type="text"
                   .value=${this.value}
                   @input=${(e: Event) => this.value = (e.target as HTMLInputElement).value}
                   @keydown=${(e: KeyboardEvent) => {
                       if (e.key === "Enter") {
                           e.preventDefault();
                           this.provideInput();
                       }
                   }}
                   placeholder=${this.papyros.io.prompt || t(`Papyros.input_placeholder.interactive`)}
                   ?disabled=${!this.papyros.io.awaitingInput}
            >
            <button @click=${() => this.provideInput()} 
                    ?disabled=${!this.papyros.io.awaitingInput}>
                ${t('Papyros.enter')}
            </button>
        `;
    }
}