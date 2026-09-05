import { customElement, state } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { inlineInputStyles, visuallyHiddenStyles } from "./shared-styles";
import { isValidFileName } from "../../util/Util";

let nextErrorId = 0;

@customElement("p-add-file-button")
export class AddFileButton extends PapyrosElement {
    @state()
    private adding = false;

    @state()
    private invalid = false;

    private addInputRef: Ref<HTMLInputElement> = createRef();
    private addButtonRef: Ref<HTMLButtonElement> = createRef();
    private readonly errorId = `add-file-error-${nextErrorId++}`;

    static get styles(): CSSResult {
        return css`
            :host {
                display: flex;
                height: 100%;
            }

            .add-btn {
                height: 100%;
                padding: 0 0.625rem;
                border: none;
                background: transparent;
                color: var(--md-sys-color-on-surface-variant);
                font: inherit;
                font-size: 1.125rem;
                line-height: 1;
                cursor: pointer;
            }

            .add-btn:hover {
                color: var(--md-sys-color-on-surface);
            }

            .add-btn:focus-visible {
                outline: 2px solid var(--md-sys-color-primary);
                outline-offset: -2px;
                border-radius: 0.25rem;
            }

            ${inlineInputStyles}
            ${visuallyHiddenStyles}
        `;
    }

    private isInvalidName(name: string): boolean {
        return !isValidFileName(name) || this.papyros.io.files.some((f) => f.name === name);
    }

    private startAdding(): void {
        this.adding = true;
        this.invalid = false;
    }

    private confirmAdd(): void {
        const name = this.addInputRef.value?.value.trim() ?? "";
        if (!this.papyros.io.addFile(name)) {
            // Enter can arrive before any input event, so the name is checked here too.
            this.invalid = true;
            return;
        }
        void this.papyros.runner.updateFile(name, "", false);
        this.adding = false;
        void this.updateComplete.then(() => this.addButtonRef.value?.focus());
    }

    private cancelAdd(): void {
        this.adding = false;
        void this.updateComplete.then(() => this.addButtonRef.value?.focus());
    }

    private onAddInput(): void {
        const value = this.addInputRef.value?.value.trim() ?? "";
        this.invalid = this.isInvalidName(value);
    }

    private onBlur(): void {
        if (!this.adding) return;
        const name = this.addInputRef.value?.value.trim() ?? "";
        if (this.isInvalidName(name)) {
            // Cancelling keeps focus from stranding in an input left open on an invalid name.
            this.cancelAdd();
        } else {
            this.confirmAdd();
        }
    }

    private onAddKeydown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            e.preventDefault();
            this.confirmAdd();
        } else if (e.key === "Escape") {
            this.cancelAdd();
        }
    }

    protected override updated(): void {
        if (this.adding) {
            this.addInputRef.value?.focus();
        }
    }

    protected override render(): TemplateResult {
        if (this.adding) {
            return html`<input
                    ${ref(this.addInputRef)}
                    class=${this.invalid ? "inline-input invalid" : "inline-input"}
                    placeholder=${this.t("Papyros.add_file_placeholder")}
                    aria-label=${this.t("Papyros.add_file")}
                    aria-invalid=${this.invalid ? "true" : "false"}
                    aria-describedby=${ifDefined(this.invalid ? this.errorId : undefined)}
                    @input=${this.onAddInput}
                    @keydown=${this.onAddKeydown}
                    @blur=${this.onBlur}
                />
                ${
                    this.invalid
                        ? html`<span id=${this.errorId} class="visually-hidden" role="alert"
                              >${this.t("Papyros.invalid_file_name")}</span
                          >`
                        : ""
                }`;
        }
        return html`<button
            ${ref(this.addButtonRef)}
            class="add-btn"
            title=${this.t("Papyros.add_file")}
            aria-label=${this.t("Papyros.add_file")}
            @click=${this.startAdding}
        >
            +
        </button>`;
    }
}
