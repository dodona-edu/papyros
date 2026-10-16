import { customElement, property } from "lit/decorators.js";
import { createRef, Ref, ref } from "lit/directives/ref.js";
import { css, CSSResult, html, PropertyValues, TemplateResult } from "lit";
import { PapyrosElement } from "../PapyrosElement";
import "@material/web/textfield/outlined-text-field";
import "@material/web/button/outlined-button";
import "@material/web/iconbutton/outlined-icon-button";

@customElement("p-interactive-input")
export class InteractiveInput extends PapyrosElement {
    @property({ state: true }) value: string = "";
    inputRef: Ref<HTMLInputElement> = createRef();

    static get styles(): CSSResult {
        return css`
            /* 40px controls: an outlined text field is 56px by default, and the button
               stretched along with it. */
            :host {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                --md-outlined-text-field-top-space: 0.5rem;
                --md-outlined-text-field-bottom-space: 0.5rem;
                --md-outlined-button-container-height: 2.5rem;
            }

            md-outlined-text-field {
                flex-grow: 1;
            }

            md-outlined-icon-button {
                display: none;
                flex-shrink: 0;
            }

            /* In a narrow input panel the button gives the room of its label to the placeholder. */
            @container papyros-input (width < 25rem) {
                md-outlined-button {
                    display: none;
                }

                md-outlined-icon-button {
                    display: inline-flex;
                }
            }
        `;
    }

    provideInput(): void {
        this.papyros.io.provideInput(this.value);
        this.value = "";
    }

    protected override updated(_changedProperties: PropertyValues): void {
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
                @input=${(e: Event) => (this.value = (e.target as HTMLInputElement).value)}
                @keydown=${(e: KeyboardEvent) => {
                    // An IME confirms composed text with Enter, which must not submit the line.
                    if (e.key === "Enter" && !e.isComposing) {
                        e.preventDefault();
                        this.provideInput();
                    }
                }}
                placeholder=${this.papyros.io.prompt || this.t("Papyros.input_placeholder.interactive")}
                aria-label=${this.papyros.io.prompt || this.t("Papyros.input_placeholder.interactive")}
                ?disabled=${!this.papyros.io.awaitingInput}
                ${ref(this.inputRef)}
            ></md-outlined-text-field>
            <md-outlined-button @click=${() => this.provideInput()} ?disabled=${!this.papyros.io.awaitingInput}>
                <span slot="icon">${this.papyros.constants.icons.enter}</span>
                ${this.t("Papyros.enter")}
            </md-outlined-button>
            <md-outlined-icon-button
                aria-label=${this.t("Papyros.enter")}
                title=${this.t("Papyros.enter")}
                @click=${() => this.provideInput()}
                ?disabled=${!this.papyros.io.awaitingInput}
            >
                ${this.papyros.constants.icons.enter}
            </md-outlined-icon-button>
        `;
    }
}
