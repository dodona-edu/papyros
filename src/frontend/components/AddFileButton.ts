import { customElement, state } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { inlineInputStyles } from "./shared-styles";
import { isValidFileName } from "../../util/Util";

@customElement("p-add-file-button")
export class AddFileButton extends PapyrosElement {
    @state()
    private adding = false;

    @state()
    private invalid = false;

    private addInputRef: Ref<HTMLInputElement> = createRef();

    static get styles(): CSSResult {
        return css`
            :host {
                display: flex;
            }

            .add-btn {
                padding: 0.375rem 0.5rem;
                border: none;
                border-bottom: 2px solid var(--md-sys-color-outline-variant);
                border-radius: 0.375rem 0.375rem 0 0;
                cursor: pointer;
                font-size: 1rem;
                line-height: 1;
                background-color: var(--md-sys-color-surface-variant);
                color: var(--md-sys-color-on-surface-variant);
            }

            .add-btn:hover {
                opacity: 0.8;
            }

            ${inlineInputStyles}
        `;
    }

    private startAdding(): void {
        this.adding = true;
        this.invalid = false;
    }

    private confirmAdd(): void {
        const name = this.addInputRef.value?.value.trim() ?? "";
        if (!this.papyros.io.addFile(name)) {
            return;
        }
        void this.papyros.runner.updateFile(name, "", false);
        this.adding = false;
    }

    private cancelAdd(): void {
        this.adding = false;
    }

    private onAddInput(): void {
        const value = this.addInputRef.value?.value.trim() ?? "";
        this.invalid = !isValidFileName(value) || this.papyros.io.files.some((f) => f.name === value);
    }

    private onBlur(): void {
        if (!this.adding) return;
        const name = this.addInputRef.value?.value.trim() ?? "";
        if (name.length === 0) {
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
                @input=${this.onAddInput}
                @keydown=${this.onAddKeydown}
                @blur=${this.onBlur}
            />`;
        }
        return html`<button
            class="add-btn"
            title=${this.t("Papyros.add_file")}
            aria-label=${this.t("Papyros.add_file")}
            @click=${this.startAdding}
        >
            +
        </button>`;
    }
}
