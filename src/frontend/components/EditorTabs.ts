import { customElement } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { CODE_TAB } from "../state/InputOutput";

@customElement("p-editor-tabs")
export class EditorTabs extends PapyrosElement {
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

    protected override render(): TemplateResult {
        const activeTab = this.papyros.io.activeEditorTab;
        return html`
            <button class=${activeTab === CODE_TAB ? "active" : ""} @click=${() => this.setTab(CODE_TAB)}>
                ${this.t("Papyros.editor_tab_code")}
            </button>
            ${this.papyros.io.files.map(
                (f) => html`
                    <button class=${activeTab === f.name ? "active" : ""} @click=${() => this.setTab(f.name)}>
                        ${f.name}
                        <span
                            class="close-btn"
                            aria-label=${this.t("Papyros.close_file_tab")}
                            @click=${(e: Event) => this.closeFile(e, f.name)}
                            >×</span
                        >
                    </button>
                `,
            )}
        `;
    }
}
