import { customElement, property } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { FileEntry } from "../state/InputOutput";

@customElement("p-file-viewer")
export class FileViewer extends PapyrosElement {
    @property({ type: Object })
    file: FileEntry | undefined = undefined;

    static get styles(): CSSResult {
        return css`
            :host {
                display: block;
                width: 100%;
                height: 100%;
                overflow: auto;
            }

            pre {
                margin: 0;
                padding: 1rem;
                font-family: monospace;
                white-space: pre-wrap;
                word-break: break-all;
                color: var(--md-sys-color-on-surface);
            }

            .placeholder-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                padding: 2rem;
                color: var(--md-sys-color-on-surface-variant);
            }

            button {
                background-color: var(--md-sys-color-primary);
                color: var(--md-sys-color-on-primary);
                border: none;
                border-radius: 1rem;
                padding: 0.5rem 1.5rem;
                cursor: pointer;
                font-size: 0.875rem;
            }

            button:hover {
                opacity: 0.9;
            }
        `;
    }

    private downloadBinary(): void {
        if (!this.file) return;
        const bytes = Uint8Array.from(atob(this.file.content), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = this.file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    protected override render(): TemplateResult {
        if (!this.file) {
            return html``;
        }
        if (this.file.binary) {
            return html`
                <div class="placeholder-container">
                    <span>${this.t("Papyros.files_binary")}</span>
                    <button @click=${this.downloadBinary}>${this.t("Papyros.files_download")}</button>
                </div>
            `;
        }
        if (this.file.content === "") {
            return html`
                <div class="placeholder-container">
                    <span>${this.t("Papyros.files_empty")}</span>
                </div>
            `;
        }
        return html`<pre>${this.file.content}</pre>`;
    }
}
