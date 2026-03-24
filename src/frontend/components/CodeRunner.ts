import { customElement } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { CODE_TAB } from "../state/InputOutput";
import "./code_runner/Code";
import "./code_runner/RunState";
import "./code_runner/ButtonLint";
import "./EditorTabs";
import "./FileViewer";

@customElement("p-code-runner")
export class CodeRunner extends PapyrosElement {
    static get styles(): CSSResult {
        return css`
            :host {
                width: 100%;
                display: flex;
                flex-direction: column;
                border-radius: 0.5rem;
            }

            div {
                flex-grow: 1;
                min-height: 0;
                position: relative;
            }

            p-run-state {
                position: absolute;
                bottom: 0;
                right: 6px;
                background-color: var(--md-sys-color-surface-container);
                padding: 0.25rem 1rem;
                border-top-right-radius: 1rem;
                border-top-left-radius: 1rem;
            }

            p-button-lint {
                background-color: var(--md-sys-color-surface-container);
            }
        `;
    }

    protected override render(): TemplateResult {
        const files = this.papyros.io.files;
        const activeTab = this.papyros.io.activeEditorTab;
        const activeFile = files.find((f) => f.name === activeTab);

        return html`
            ${files.length > 0 ? html`<p-editor-tabs .papyros=${this.papyros}></p-editor-tabs>` : ""}
            <div>
                ${activeTab === CODE_TAB
                    ? html`<p-code .papyros=${this.papyros}></p-code>`
                    : html`<p-file-viewer .papyros=${this.papyros} .file=${activeFile}></p-file-viewer>`}
                ${this.papyros.runner.stateMessage ? html`<p-run-state .papyros=${this.papyros}></p-run-state>` : ""}
            </div>
            <p-button-lint .papyros=${this.papyros}>
                <slot name="buttons"></slot>
            </p-button-lint>
        `;
    }
}
