import {customElement, property} from "lit/decorators.js";
import {html, LitElement, TemplateResult} from "lit";
import {StateController} from "@dodona/lit-state";
import {Papyros, papyros} from "../../state/Papyros";
import {t} from "../../util/Util";

@customElement("p-interactive-input")
export class InteractiveInput extends LitElement {
    controller = new StateController(this);
    @property()
    papyros: Papyros = papyros;

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