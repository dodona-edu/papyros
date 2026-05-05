import { customElement, state } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { CODE_TAB } from "../state/InputOutput";
import { isValidFileName } from "../../util/Util";
import "./code_runner/Code";
import "./code_runner/RunState";
import "./code_runner/ButtonLint";
import "./EditorTabs";
import "./FileViewer";

const TEXT_MIME_PATTERNS = ["text/", "application/json", "application/xml", "application/javascript"];

function isTextMimeType(mime: string | null | undefined): boolean {
    if (!mime) {
        // No MIME type — assume text
        return true;
    }
    // Strip parameters like "; charset=utf-8" before matching
    const base = mime.split(";")[0].trim().toLowerCase();
    return TEXT_MIME_PATTERNS.some((prefix) => base.startsWith(prefix));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const CHUNK = 8192;
    const chunks: string[] = [];
    for (let i = 0; i < bytes.length; i += CHUNK) {
        chunks.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)));
    }
    return btoa(chunks.join(""));
}

@customElement("p-code-runner")
export class CodeRunner extends PapyrosElement {
    @state()
    private dragOver = false;

    private dropZoneRef: Ref<HTMLDivElement> = createRef();

    static get styles(): CSSResult {
        return css`
            :host {
                width: 100%;
                display: flex;
                flex-direction: column;
                border-radius: 0.5rem;
            }

            .drop-zone {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
                min-height: 0;
                position: relative;
            }

            .drop-zone.drag-over::after {
                content: "";
                position: absolute;
                inset: 0;
                border: 2px dashed var(--md-sys-color-primary);
                border-radius: 0.5rem;
                background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
                pointer-events: none;
                z-index: 10;
            }

            .editor {
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

    protected override firstUpdated(): void {
        const dropZone = this.dropZoneRef.value;
        if (!dropZone) return;
        // Use capture phase so we intercept before CodeMirror handles the drop
        dropZone.addEventListener("dragover", this.onDragOver, true);
        dropZone.addEventListener("dragleave", this.onDragLeave, true);
        dropZone.addEventListener("drop", this.onDrop, true);
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        const dropZone = this.dropZoneRef.value;
        if (!dropZone) return;
        dropZone.removeEventListener("dragover", this.onDragOver, true);
        dropZone.removeEventListener("dragleave", this.onDragLeave, true);
        dropZone.removeEventListener("drop", this.onDrop, true);
    }

    private onDragOver = (e: DragEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        if (this.papyros.debugger.active) return;
        if (!this.dragOver) this.dragOver = true;
    };

    private onDragLeave = (e: DragEvent): void => {
        const dropZone = this.dropZoneRef.value;
        // Only react if leaving the drop zone, not moving between children
        if (e.relatedTarget && dropZone?.contains(e.relatedTarget as Node)) return;
        this.dragOver = false;
    };

    private onDrop = (e: DragEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        this.dragOver = false;

        if (this.papyros.debugger.active || !e.dataTransfer) return;

        for (const file of Array.from(e.dataTransfer.files)) {
            this.readAndAddFile(file);
        }

        if (e.dataTransfer.types.includes("text/uri-list")) {
            const uriList = e.dataTransfer.getData("text/uri-list");
            const urls = uriList
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line && !line.startsWith("#"));
            for (const url of urls) {
                void this.fetchAndAddUrl(url);
            }
        }
    };

    private upsertFile(name: string, content: string, binary: boolean): void {
        this.papyros.io.upsertFile(name, content, binary);
        void this.papyros.runner.updateFile(name, content, binary);
    }

    private readAndAddFile(file: File): void {
        const reader = new FileReader();
        if (isTextMimeType(file.type)) {
            reader.onload = (): void => {
                this.upsertFile(file.name, reader.result as string, false);
            };
            reader.readAsText(file);
        } else {
            reader.onload = (): void => {
                this.upsertFile(file.name, arrayBufferToBase64(reader.result as ArrayBuffer), true);
            };
            reader.readAsArrayBuffer(file);
        }
    }

    private filenameFromUrl(url: URL): string {
        const segments = url.pathname.split("/").filter((s) => s.length > 0);
        let candidate = segments[segments.length - 1] ?? "";
        try {
            candidate = decodeURIComponent(candidate);
        } catch {
            // Leave as-is if decoding fails
        }
        if (isValidFileName(candidate)) return candidate;
        if (isValidFileName(url.hostname)) return url.hostname;
        return "download";
    }

    private async fetchAndAddUrl(rawUrl: string): Promise<void> {
        try {
            const url = new URL(rawUrl);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }
            const name = this.filenameFromUrl(url);
            const contentType = response.headers.get("Content-Type");
            if (isTextMimeType(contentType)) {
                this.upsertFile(name, await response.text(), false);
            } else {
                this.upsertFile(name, arrayBufferToBase64(await response.arrayBuffer()), true);
            }
        } catch (err) {
            console.warn("Failed to fetch dropped URL:", rawUrl, err);
            alert(this.t("Papyros.url_fetch_error", { url: rawUrl }));
        }
    }

    protected override render(): TemplateResult {
        const files = this.papyros.debugger.active ? this.papyros.debugger.debugFiles : this.papyros.io.files;
        const activeTab = this.papyros.io.activeEditorTab;
        const activeFile = files.find((f) => f.name === activeTab);

        return html`
            <div ${ref(this.dropZoneRef)} class="drop-zone ${this.dragOver ? "drag-over" : ""}">
                <p-editor-tabs .papyros=${this.papyros} .files=${files}></p-editor-tabs>
                <div class="editor">
                    ${activeTab === CODE_TAB
                        ? html`<p-code .papyros=${this.papyros}></p-code>`
                        : html`<p-file-viewer .papyros=${this.papyros} .file=${activeFile}></p-file-viewer>`}
                    ${this.papyros.runner.stateMessage
                        ? html`<p-run-state .papyros=${this.papyros}></p-run-state>`
                        : ""}
                </div>
                <p-button-lint .papyros=${this.papyros}>
                    <slot name="buttons"></slot>
                </p-button-lint>
            </div>
        `;
    }
}
