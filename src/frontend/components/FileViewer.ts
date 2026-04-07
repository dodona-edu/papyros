import { customElement, property } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { FileEntry } from "../state/InputOutput";
import { debounce } from "../../util/Util";
import "./code_mirror/FileEditor";

@customElement("p-file-viewer")
export class FileViewer extends PapyrosElement {
    @property({ type: Object })
    file: FileEntry | undefined = undefined;

    private debouncedUpdateFile = debounce((name: string, content: string) => {
        void this.papyros.runner.updateFile(name, content);
    }, 300);

    static get styles(): CSSResult {
        return css`
            :host {
                display: block;
                width: 100%;
                height: 100%;
                overflow: auto;
            }

            p-file-editor {
                display: block;
                width: 100%;
                height: 100%;
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

    private onEditorChange(e: CustomEvent): void {
        if (!this.file || this.papyros.debugger.active) return;
        const name = this.file.name;
        const content = e.detail as string;
        this.papyros.io.updateFileContent(name, content);
        this.debouncedUpdateFile(name, content);
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
        const readonly = this.papyros.debugger.active;
        return html`
            <p-file-editor
                .value=${this.file.content}
                .readonly=${readonly}
                .theme=${this.papyros.constants.CodeMirrorTheme}
                @change=${this.onEditorChange}
            ></p-file-editor>
        `;
    }
}
