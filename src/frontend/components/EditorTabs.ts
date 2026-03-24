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
            }

            button.active {
                background-color: var(--md-sys-color-surface);
                color: var(--md-sys-color-on-surface);
            }

            button:hover:not(.active) {
                opacity: 0.8;
            }
        `;
    }

    private setTab(tab: string): void {
        this.papyros.io.activeEditorTab = tab;
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
                    </button>
                `,
            )}
        `;
    }
}
