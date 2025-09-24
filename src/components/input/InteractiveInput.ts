import {customElement, property} from "lit/decorators.js";
import {createRef, Ref, ref} from "lit/directives/ref.js";
import {css, html, PropertyValues, TemplateResult} from "lit";
import {t} from "../../util/Util";
import {PapyrosElement} from "../extras/PapyrosElement";
import "@material/web/textfield/outlined-text-field";
import "@material/web/button/outlined-button";

@customElement("p-interactive-input")
export class InteractiveInput extends PapyrosElement {
    @property({state: true})
    value: string = '';
    inputRef: Ref<HTMLInputElement> = createRef();

    static get styles() {
        return css`
            :host {
                width: 100%;
                display: flex;
                gap: 0.5rem;
            }
            
            md-outlined-text-field {
                flex-grow: 1;
            }
        `
    }

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
            <md-outlined-text-field
                    type="text"
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
            ></md-outlined-text-field>
            <md-outlined-button
                    @click=${() => this.provideInput()} 
                    ?disabled=${!this.papyros.io.awaitingInput}>
                ${t('Papyros.enter')}
            </md-outlined-button>
        `;
    }
}