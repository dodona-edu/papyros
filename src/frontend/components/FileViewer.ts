import { customElement, property } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { FileEntry } from "../state/InputOutput";
import { debounce } from "../../util/Util";

import type { FileEditor } from "./code_mirror/FileEditor";
import "./code_mirror/FileEditor";

// Longer text is not rendered in a read-only viewer, to keep the page responsive
const MAX_READONLY_PREVIEW_LENGTH = 100_000;

@customElement("p-file-viewer")
export class FileViewer extends PapyrosElement {
    @property({ type: Object })
    file: FileEntry | undefined = undefined;

    /** Makes the file read-only, and offers an open link instead of a preview for files that cannot be shown */
    @property({ type: Boolean })
    readonly = false;

    /** Where the file can be opened; without it a download button is offered instead */
    @property({ type: String })
    url: string | undefined = undefined;

    private editorRef: Ref<FileEditor> = createRef();

    private debouncedUpdateFile = debounce((name: string, content: string) => {
        // Writing a file that was closed while its edit was pending would recreate it in the backend
        if (this.papyros.io.files.some((f) => f.name === name)) {
            void this.papyros.runner.updateFile(name, content, false);
        }
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

            a.open-link {
                color: var(--md-sys-color-primary);
                font-size: 0.875rem;
            }
        `;
    }

    private downloadBinary(): void {
        if (!this.file) return;
        const blob = new Blob([
            this.file.binary ? Uint8Array.from(atob(this.file.content), (c) => c.charCodeAt(0)) : this.file.content,
        ]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = this.file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        // Switching to another tab removes this viewer; the edit still has to reach the backend.
        this.debouncedUpdateFile.flush();
    }

    protected override willUpdate(changedProperties: Map<PropertyKey, unknown>): void {
        // Every edit hands in a new object for the same file, so only a different name means another file
        const previous = changedProperties.get("file") as FileEntry | undefined;
        if (previous && previous.name !== this.file?.name) {
            this.debouncedUpdateFile.flush();
        }
    }

    protected override updated(changedProperties: Map<PropertyKey, unknown>): void {
        if (changedProperties.has("file") && this.file && !this.file.binary && !this.readonly) {
            this.editorRef.value?.focus();
        }
    }

    private onEditorChange(e: CustomEvent): void {
        // A read-only preview also fires change when its content is swapped in; it is not an edit
        if (!this.file || this.readonly || this.papyros.debugger.active) return;
        const name = this.file.name;
        const content = e.detail as string;
        this.papyros.io.updateFileContent(name, content, this.file.binary);
        this.debouncedUpdateFile(name, content);
    }

    protected override render(): TemplateResult {
        if (!this.file) {
            return html``;
        }
        if (this.file.binary || (this.readonly && this.file.content.length > MAX_READONLY_PREVIEW_LENGTH)) {
            const message = this.readonly
                ? this.t("Papyros.playground.file_not_previewable", { name: this.file.name })
                : this.t("Papyros.files_binary");
            return html`
                <div class="placeholder-container">
                    <span>${message}</span>
                    ${
                        this.readonly && this.url
                            ? html`<a class="open-link" href=${this.url} target="_blank" rel="noopener"
                                  >${this.t("Papyros.playground.open_file")}</a
                              >`
                            : html`<button @click=${this.downloadBinary}>${this.t("Papyros.files_download")}</button>`
                    }
                </div>
            `;
        }
        const readonly = this.readonly || this.papyros.debugger.active;
        return html`
            <p-file-editor
                ${ref(this.editorRef)}
                .value=${this.file.content}
                .readonly=${readonly}
                .theme=${this.papyros.constants.CodeMirrorTheme}
                .fileName=${this.file.name}
                .accessibleName=${this.t("Papyros.editor.file_label", { name: this.file.name })}
                @change=${this.onEditorChange}
            ></p-file-editor>
        `;
    }
}
