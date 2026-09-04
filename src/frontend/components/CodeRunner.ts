import { customElement, state } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, PropertyValues, TemplateResult } from "lit";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { CODE_TAB } from "../state/InputOutput";
import { arrayBufferToBase64, isTextMimeType } from "../../util/Util";
import "./code_runner/Code";
import "./code_runner/RunState";
import "./code_runner/ButtonLint";
import "./EditorTabs";
import "./FileViewer";
import { paneStyles } from "./shared-styles";

@customElement("p-code-runner")
export class CodeRunner extends PapyrosElement {
    @state()
    private dragOver = false;

    @state()
    private editorFocused = false;

    private dropZoneRef: Ref<HTMLDivElement> = createRef();

    static get styles(): CSSResult {
        return css`
            :host {
                width: 100%;
                display: flex;
                flex-direction: column;
            }

            ${paneStyles}

            .pane {
                flex-grow: 1;
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
                border-radius: 0.625rem;
                background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
                pointer-events: none;
                z-index: 10;
            }

            .editor {
                flex-grow: 1;
                min-height: 0;
                position: relative;
            }

            .footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
                height: 1.5rem;
                padding: 0 0.75rem;
                flex-shrink: 0;
                border-top: 1px solid var(--md-sys-color-outline-variant);
                font-size: 0.75rem;
                color: var(--md-sys-color-on-surface-variant);
            }

            .hint {
                visibility: hidden;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .editor-focused .hint {
                visibility: visible;
            }
        `;
    }

    /**
     * Reflect backend readiness on the host, so surrounding pages can style or
     * wait on it. Reading the state here keeps it inside the update cycle the
     * StateController records, so the host re-renders when it flips.
     */
    protected override update(changedProperties: PropertyValues): void {
        this.toggleAttribute("backend-ready", this.papyros.runner.backendReady);
        super.update(changedProperties);
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
                void this.papyros.runner.fetchAndAddUrl(url);
            }
        }
    };

    private readAndAddFile(file: File): void {
        const reader = new FileReader();
        if (isTextMimeType(file.type)) {
            reader.onload = (): void => {
                this.papyros.runner.upsertFile(file.name, reader.result as string, false);
            };
            reader.readAsText(file);
        } else {
            reader.onload = (): void => {
                this.papyros.runner.upsertFile(file.name, arrayBufferToBase64(reader.result as ArrayBuffer), true);
            };
            reader.readAsArrayBuffer(file);
        }
    }

    protected override render(): TemplateResult {
        const files = this.papyros.debugger.active ? this.papyros.debugger.debugFiles : this.papyros.io.files;
        const activeTab = this.papyros.io.activeEditorTab;
        const activeFile = files.find((f) => f.name === activeTab);

        return html`
            <div ${ref(this.dropZoneRef)} class="drop-zone ${this.dragOver ? "drag-over" : ""}">
                <div class="pane ${this.editorFocused && activeTab === CODE_TAB ? "editor-focused" : ""}">
                    <p-editor-tabs .papyros=${this.papyros} .files=${files}></p-editor-tabs>
                    <!-- The tabs live in another shadow root, so the panel is named directly instead of by aria-labelledby. -->
                    <div
                        class="editor"
                        role="tabpanel"
                        aria-label=${activeTab === CODE_TAB ? this.t("Papyros.editor_tab_code") : activeTab}
                        @focusin=${() => (this.editorFocused = true)}
                        @focusout=${() => (this.editorFocused = false)}
                    >
                        ${
                            activeTab === CODE_TAB
                                ? html`<p-code .papyros=${this.papyros}></p-code>`
                                : html`<p-file-viewer .papyros=${this.papyros} .file=${activeFile}></p-file-viewer>`
                        }
                    </div>
                    <div class="footer">
                        <p-run-state .papyros=${this.papyros}></p-run-state>
                        <span class="hint" aria-hidden="true">${this.t("Papyros.editor.escape_hint")}</span>
                    </div>
                </div>
                <p-button-lint .papyros=${this.papyros}>
                    <slot name="buttons"></slot>
                </p-button-lint>
            </div>
        `;
    }
}
