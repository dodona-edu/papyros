import { customElement, property } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { FileEntry } from "../state/InputOutput";
import { debounce } from "../../util/Util";
import type { FileEditor } from "./code_mirror/FileEditor";
import "./code_mirror/FileEditor";

// Longer text that can be opened from its URL is not rendered, to keep the page responsive
const MAX_PREVIEW_LENGTH = 100_000;

@customElement("p-file-viewer")
export class FileViewer extends PapyrosElement {
    @property({ type: Object })
    file: FileEntry | undefined = undefined;

    /** Whether this file's tab is open. Viewers of the other files stay mounted, hidden. */
    @property({ type: Boolean })
    active = true;

    @property({ type: Boolean })
    readonly = false;

    /** Where the file can be opened when it is not shown; without it a binary file gets a download button */
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

            :host([hidden]) {
                display: none;
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
        const bytes = Uint8Array.from(atob(this.file.content), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = this.file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        // Removed with its code runner, or by a debug frame that lacks the file: the edit still has to
        // reach the backend. A deleted or renamed file is skipped by debouncedUpdateFile.
        this.debouncedUpdateFile.flush();
    }

    protected override willUpdate(): void {
        this.hidden = !this.active;
    }

    protected override updated(changedProperties: Map<PropertyKey, unknown>): void {
        const opened =
            changedProperties.has("active") ||
            (changedProperties.has("file") && changedProperties.get("file") === undefined);
        if (opened && this.active && this.file && !this.file.binary && !this.readonly) {
            this.editorRef.value?.focus();
        }
    }

    private onEditorChange(e: CustomEvent): void {
        // A read-only preview is never edited, so it has nothing to write back
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
        if (this.file.binary || (this.url && this.file.content.length > MAX_PREVIEW_LENGTH)) {
            const message = this.url
                ? this.t("Papyros.file_not_previewable", { name: this.file.name })
                : this.t("Papyros.files_binary");
            return html`
                <div class="placeholder-container">
                    <span>${message}</span>
                    ${
                        this.url
                            ? html`<a class="open-link" href=${this.url} target="_blank" rel="noopener"
                                  >${this.t("Papyros.open_file")}</a
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
