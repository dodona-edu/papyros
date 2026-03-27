import { customElement, property, state } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { FileEntry } from "../state/InputOutput";
import { inlineInputStyles, tabButtonStyles } from "./shared-styles";

@customElement("p-editor-tab")
export class EditorTab extends PapyrosElement {
    @property({ attribute: false })
    file!: FileEntry;

    @state()
    private renaming = false;

    private renameInputRef: Ref<HTMLInputElement> = createRef();

    static get styles(): CSSResult {
        return css`
            ${tabButtonStyles}

            .close-btn,
            .rename-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 0;
                height: 1rem;
                overflow: hidden;
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

            button:hover .rename-btn,
            button:hover .close-btn,
            button:focus-within .rename-btn,
            button:focus-within .close-btn,
            button.active .rename-btn,
            button.active .close-btn {
                width: 1rem;
            }

            .close-btn:hover {
                opacity: 1;
                background-color: var(--md-sys-color-error);
                color: var(--md-sys-color-on-error);
            }

            .rename-btn:hover {
                opacity: 1;
                background-color: var(--md-sys-color-primary);
                color: var(--md-sys-color-on-primary);
            }

            ${inlineInputStyles}
        `;
    }

    private setTab(): void {
        this.papyros.io.activeEditorTab = this.file.name;
    }

    private closeFile(e: Event): void {
        e.stopPropagation();
        this.papyros.io.removeFile(this.file.name);
        void this.papyros.runner.deleteFile(this.file.name);
    }

    private startRenaming(): void {
        this.renaming = true;
    }

    private confirmRename(): void {
        if (!this.renaming) return;
        const oldName = this.file.name;
        const newName = this.renameInputRef.value?.value.trim() ?? "";
        this.renaming = false;
        if (!this.papyros.io.renameFile(oldName, newName)) {
            return;
        }
        void this.papyros.runner.renameFile(oldName, newName);
    }

    private cancelRename(): void {
        this.renaming = false;
    }

    private onRenameKeydown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            e.preventDefault();
            this.confirmRename();
        } else if (e.key === "Escape") {
            this.cancelRename();
        }
    }

    private onDblClick(): void {
        if (!this.papyros.debugger.active) this.startRenaming();
    }

    private onAuxClick(e: MouseEvent): void {
        if (!this.papyros.debugger.active && e.button === 1) this.closeFile(e);
    }

    private onRenameClick(e: Event): void {
        e.stopPropagation();
        this.startRenaming();
    }

    private onRenameBtnKeydown(e: KeyboardEvent): void {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            this.startRenaming();
        }
    }

    private onCloseBtnKeydown(e: KeyboardEvent): void {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.closeFile(e);
        }
    }

    protected override updated(): void {
        if (this.renaming) {
            const input = this.renameInputRef.value;
            if (input) {
                input.focus();
                input.select();
            }
        }
    }

    protected override render(): TemplateResult {
        const active = this.papyros.io.activeEditorTab === this.file.name;
        const debugActive = this.papyros.debugger.active;

        if (!debugActive && this.renaming) {
            return html`<input
                ${ref(this.renameInputRef)}
                class="inline-input"
                .value=${this.file.name}
                @keydown=${this.onRenameKeydown}
                @blur=${this.confirmRename}
            />`;
        }

        return html`
            <button
                class=${active ? "active" : ""}
                @click=${this.setTab}
                @dblclick=${this.onDblClick}
                @auxclick=${this.onAuxClick}
            >
                ${this.file.name}
                ${debugActive
                    ? ""
                    : html`<span
                              class="rename-btn"
                              role="button"
                              tabindex="0"
                              aria-label=${this.t("Papyros.rename_file_tab")}
                              @click=${this.onRenameClick}
                              @keydown=${this.onRenameBtnKeydown}
                              >✎</span
                          ><span
                              class="close-btn"
                              role="button"
                              tabindex="0"
                              aria-label=${this.t("Papyros.close_file_tab")}
                              @click=${this.closeFile}
                              @keydown=${this.onCloseBtnKeydown}
                              >×</span
                          >`}
            </button>
        `;
    }
}
