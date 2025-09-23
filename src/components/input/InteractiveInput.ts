import {customElement, property} from "lit/decorators.js";
import {createRef, Ref, ref} from "lit/directives/ref.js";
import {html, PropertyValues, TemplateResult} from "lit";
import {t} from "../../util/Util";
import {PapyrosElement} from "../helpers/PapyrosElement";

@customElement("p-interactive-input")
export class InteractiveInput extends PapyrosElement {
    @property({state: true})
    value: string = '';
    inputRef: Ref<HTMLInputElement> = createRef();

    provideInput(): void {
        this.papyros.io.provideInput(this.value);
        this.value = '';
    }

    protected override updated(_changedProperties: PropertyValues) {
        super.updated(_changedProperties);
        if (this.papyros.io.awaitingInput) {
            this.inputRef.value!.focus();
        }
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
                   ${ref(this.inputRef)}
            >
            <button @click=${() => this.provideInput()} 
                    ?disabled=${!this.papyros.io.awaitingInput}>
                ${t('Papyros.enter')}
            </button>
        `;
    }
}