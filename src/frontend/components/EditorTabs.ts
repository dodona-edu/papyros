import { customElement, property, state } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { CODE_TAB, FileEntry } from "../state/InputOutput";

@customElement("p-editor-tabs")
export class EditorTabs extends PapyrosElement {
    @property({ attribute: false })
    files: FileEntry[] = [];

    @state()
    private adding = false;

    private addInputRef: Ref<HTMLInputElement> = createRef();

    static get styles(): CSSResult {
        return css`
            :host {
                display: flex;
                flex-direction: row;
                gap: 0.25rem;
                padding: 0.25rem 0.25rem 0;
                background-color: var(--md-sys-color-surface-container);
                border-radius: 0.5rem 0.5rem 0 0;
                max-height: 2.5rem;
                flex-shrink: 0;
                overflow-x: auto;
            }

            button {
                padding: 0.375rem 0.75rem;
                border: none;
                border-radius: 0.375rem 0.375rem 0 0;
                cursor: pointer;
                font-size: 0.875rem;
                background-color: var(--md-sys-color-surface-variant);
                color: var(--md-sys-color-on-surface-variant);
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 0.375rem;
            }

            button.active {
                background-color: var(--md-sys-color-surface);
                color: var(--md-sys-color-on-surface);
            }

            button:hover:not(.active) {
                opacity: 0.8;
            }

            .close-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 1rem;
                height: 1rem;
                border-radius: 50%;
                font-size: 0.75rem;
                line-height: 1;
                padding: 0;
                background: transparent;
                border: none;
                cursor: pointer;
                color: inherit;
                opacity: 0.6;
            }

            .close-btn:hover {
                opacity: 1;
                background-color: var(--md-sys-color-error);
                color: var(--md-sys-color-on-error);
            }

            .add-btn {
                padding: 0.375rem 0.5rem;
                font-size: 1rem;
                line-height: 1;
            }

            .add-input {
                font-size: 0.875rem;
                padding: 0.25rem 0.5rem;
                border: 1px solid var(--md-sys-color-outline);
                border-radius: 0.375rem 0.375rem 0 0;
                background-color: var(--md-sys-color-surface);
                color: var(--md-sys-color-on-surface);
                width: 8rem;
                outline: none;
            }
        `;
    }

    private setTab(tab: string): void {
        this.papyros.io.activeEditorTab = tab;
    }

    private closeFile(e: Event, name: string): void {
        e.stopPropagation();
        this.papyros.io.removeFile(name);
        void this.papyros.runner.deleteFile(name);
    }

    private startAdding(): void {
        this.adding = true;
    }

    private confirmAdd(input: HTMLInputElement): void {
        const name = input.value.trim();
        if (!name || this.files.some((f) => f.name === name)) {
            this.adding = false;
            return;
        }
        this.papyros.io.addFile(name);
        void this.papyros.runner.updateFile(name, "");
        this.adding = false;
    }

    private cancelAdd(): void {
        this.adding = false;
    }

    private onAddKeydown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            this.confirmAdd(e.target as HTMLInputElement);
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
        const activeTab = this.papyros.io.activeEditorTab;
        const debugActive = this.papyros.debugger.active;
        return html`
            <button class=${activeTab === CODE_TAB ? "active" : ""} @click=${() => this.setTab(CODE_TAB)}>
                ${this.t("Papyros.editor_tab_code")}
            </button>
            ${this.files.map(
                (f) => html`
                    <button class=${activeTab === f.name ? "active" : ""} @click=${() => this.setTab(f.name)}>
                        ${f.name}
                        ${debugActive
                            ? ""
                            : html`<span
                                  class="close-btn"
                                  role="button"
                                  tabindex="0"
                                  aria-label=${this.t("Papyros.close_file_tab")}
                                  @click=${(e: Event) => this.closeFile(e, f.name)}
                                  >×</span
                              >`}
                    </button>
                `,
            )}
            ${debugActive
                ? ""
                : this.adding
                  ? html`<input
                        ${ref(this.addInputRef)}
                        class="add-input"
                        placeholder=${this.t("Papyros.add_file_placeholder")}
                        @keydown=${this.onAddKeydown}
                        @blur=${this.cancelAdd}
                    />`
                  : html`<button class="add-btn" aria-label=${this.t("Papyros.add_file")} @click=${this.startAdding}>
                        +
                    </button>`}
        `;
    }
}
