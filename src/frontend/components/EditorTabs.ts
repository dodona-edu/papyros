import { customElement, property } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { CODE_TAB, FileEntry } from "../state/InputOutput";
import "./EditorTab";
import "./AddFileButton";
import { tabButtonStyles } from "./shared-styles";

@customElement("p-editor-tabs")
export class EditorTabs extends PapyrosElement {
    @property({ attribute: false })
    files: FileEntry[] = [];

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

            ${tabButtonStyles}
        `;
    }

    protected override render(): TemplateResult {
        const activeTab = this.papyros.io.activeEditorTab;
        const debugActive = this.papyros.debugger.active;
        return html`
            <button
                class=${activeTab === CODE_TAB ? "active" : ""}
                @click=${() => (this.papyros.io.activeEditorTab = CODE_TAB)}
            >
                ${this.t("Papyros.editor_tab_code")}
            </button>
            ${this.files.map((f) => html`<p-editor-tab .papyros=${this.papyros} .file=${f}></p-editor-tab>`)}
            ${debugActive ? "" : html`<p-add-file-button .papyros=${this.papyros}></p-add-file-button>`}
        `;
    }
}
