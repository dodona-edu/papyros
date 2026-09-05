import { customElement, property, state } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { FileEntry } from "../state/InputOutput";
import { inlineInputStyles, tabButtonStyles, visuallyHiddenStyles } from "./shared-styles";
import { isValidFileName } from "../../util/Util";

let nextId = 0;

@customElement("p-editor-tab")
export class EditorTab extends PapyrosElement {
    @property({ attribute: false })
    file!: FileEntry;

    @state()
    private renaming = false;

    @state()
    private invalid = false;

    private renameInputRef: Ref<HTMLInputElement> = createRef();
    private tabButtonRef: Ref<HTMLButtonElement> = createRef();
    private readonly instanceId = nextId++;
    private readonly errorId = `rename-error-${this.instanceId}`;
    private readonly hintId = `tab-hint-${this.instanceId}`;

    static get styles(): CSSResult {
        return css`
            :host {
                display: flex;
            }

            ${tabButtonStyles}

            .close-btn,
            .rename-btn {
                display: none;
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

            .rename-btn svg {
                width: 0.75rem;
                height: 0.75rem;
            }

            button.active .rename-btn,
            button.active .close-btn {
                display: inline-flex;
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
            ${visuallyHiddenStyles}
        `;
    }

    /** Focuses the underlying tab button; used for roving tabindex navigation from EditorTabs. */
    public focusTab(): void {
        this.tabButtonRef.value?.focus();
    }

    private setTab(): void {
        this.papyros.io.activeEditorTab = this.file.name;
    }

    private closeFile(e: Event): void {
        e.stopPropagation();
        if (!confirm(this.t("Papyros.close_file_confirm"))) return;
        this.papyros.io.removeFile(this.file.name);
        void this.papyros.runner.deleteFile(this.file.name);
    }

    private startRenaming(): void {
        this.renaming = true;
        this.invalid = false;
    }

    /** Returns whether renaming ended, so the caller can decide what to do with focus. */
    private confirmRename(): boolean {
        if (!this.renaming) return true;
        const oldName = this.file.name;
        const newName = this.renameInputRef.value?.value.trim() ?? "";
        if (newName === oldName) {
            this.renaming = false;
            return true;
        }
        if (!this.papyros.io.renameFile(oldName, newName)) {
            this.invalid = true;
            return false;
        }
        this.renaming = false;
        void this.papyros.runner.renameFile(oldName, newName);
        return true;
    }

    private cancelRename(): void {
        this.renaming = false;
    }

    // Leaving an invalid name behind would strand the unfocused input, so blur cancels instead.
    private onRenameBlur(): void {
        if (!this.confirmRename()) this.cancelRename();
    }

    private refocusTab(): void {
        void this.updateComplete.then(() => this.focusTab());
    }

    private onRenameInput(): void {
        const value = this.renameInputRef.value?.value.trim() ?? "";
        this.invalid =
            !isValidFileName(value) ||
            (value !== this.file.name && this.papyros.io.files.some((f) => f.name === value));
    }

    private onRenameKeydown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            e.preventDefault();
            if (this.confirmRename()) this.refocusTab();
        } else if (e.key === "Escape") {
            this.cancelRename();
            this.refocusTab();
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

    // The rename and close controls are pointer-only, so the tab itself carries their keys.
    private onTabKeydown(e: KeyboardEvent): void {
        if (this.papyros.debugger.active) return;
        if (e.key === "F2") {
            e.preventDefault();
            this.startRenaming();
        } else if (e.key === "Delete" || e.key === "Backspace") {
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
                    class=${this.invalid ? "inline-input invalid" : "inline-input"}
                    aria-label=${this.t("Papyros.rename_file_tab")}
                    aria-invalid=${this.invalid ? "true" : "false"}
                    aria-describedby=${ifDefined(this.invalid ? this.errorId : undefined)}
                    .value=${this.file.name}
                    @input=${this.onRenameInput}
                    @keydown=${this.onRenameKeydown}
                    @blur=${this.onRenameBlur}
                />
                ${
                    this.invalid
                        ? html`<span id=${this.errorId} class="visually-hidden" role="alert"
                              >${this.t("Papyros.invalid_file_name")}</span
                          >`
                        : ""
                }`;
        }

        return html`
            <button
                ${ref(this.tabButtonRef)}
                class=${active ? "active" : ""}
                role="tab"
                aria-selected=${active ? "true" : "false"}
                tabindex=${active ? "0" : "-1"}
                aria-describedby=${ifDefined(debugActive ? undefined : this.hintId)}
                @click=${this.setTab}
                @dblclick=${this.onDblClick}
                @auxclick=${this.onAuxClick}
                @keydown=${this.onTabKeydown}
            >
                ${this.file.name}
                ${
                    debugActive
                        ? ""
                        : html`<span
                                  class="rename-btn"
                                  title=${this.t("Papyros.rename_file_tab")}
                                  aria-hidden="true"
                                  @click=${this.onRenameClick}
                              >
                                  ${this.papyros.constants.icons.edit}
                              </span>
                              <span
                                  class="close-btn"
                                  title=${this.t("Papyros.close_file_tab")}
                                  aria-hidden="true"
                                  @click=${this.closeFile}
                                  >×</span
                              >`
                }
            </button>
            ${
                debugActive
                    ? ""
                    : html`<span id=${this.hintId} class="visually-hidden">${this.t("Papyros.file_tab_hint")}</span>`
            }
        `;
    }
}
