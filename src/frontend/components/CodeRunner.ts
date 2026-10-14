import { customElement, property, state } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, PropertyValues, TemplateResult } from "lit";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { repeat } from "lit/directives/repeat.js";
import { CODE_TAB, EditorTabId, FileEntry, HOST_TAB } from "../state/InputOutput";
import { arrayBufferToBase64, isTextMimeType } from "../../util/Util";
import "./code_runner/Code";
import "./code_runner/RunState";
import "./code_runner/ButtonLint";
import type { ButtonLint } from "./code_runner/ButtonLint";
import "./EditorTabs";
import type { EditorTabs } from "./EditorTabs";
import "./FileViewer";
import { paneStyles } from "./shared-styles";

@customElement("p-code-runner")
export class CodeRunner extends PapyrosElement {
    @state()
    private dragOver = false;

    @state()
    private showEscapeHint = false;

    /** The text of the label in the `host-tab` slot, or undefined while that slot is empty and the tab hidden. */
    @state()
    private hostTabLabel: string | undefined = undefined;

    private dropZoneRef: Ref<HTMLDivElement> = createRef();
    private hostTabSlotRef: Ref<HTMLSlotElement> = createRef();
    /** The host can rewrite its label in place, which fires no slotchange. */
    private hostTabObserver = new MutationObserver(() => this.readHostTabLabel());
    private toolbarRef: Ref<HTMLDivElement> = createRef();
    private toolbarWidthRef: Ref<HTMLDivElement> = createRef();
    private tabsRef: Ref<EditorTabs> = createRef();
    private buttonsRef: Ref<ButtonLint> = createRef();
    private toolbarObserver = new ResizeObserver(() => this.updateCompactButtons());
    private labelledSlottedWidth: number | undefined = undefined;
    private compactSlottedWidth: number | undefined = undefined;

    /** Set when the slotted buttons do not fit with their labels, so the host can compact them. */
    @property({ type: Boolean, reflect: true, attribute: "compact-slotted" })
    compactSlotted = false;

    static get styles(): CSSResult {
        return css`
            /* Named, so the host's slotted content can query its width. */
            :host {
                width: 100%;
                display: flex;
                flex-direction: column;
                container: papyros-code-runner / inline-size;
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

            .toolbar {
                position: relative;
                display: flex;
                flex-wrap: wrap;
                flex-shrink: 0;
            }

            /* Observed for the width of the toolbar. It has no height, so compacting the buttons does
               not resize it when that unwraps the toolbar; observing the toolbar itself made a
               ResizeObserver loop. */
            .toolbar-width {
                position: absolute;
                inset-inline: 0;
                height: 0;
            }

            /* Grows with a taller button row next to it, so the two hairlines stay level. */
            p-editor-tabs {
                flex: 1 1 auto;
                min-width: 0;
                height: auto;
                min-height: 2.75rem;
            }

            /* Grows rather than being pushed to the end, so a wrapped row keeps its hairline across the pane. */
            p-button-lint {
                flex: 1 1 auto;
                min-width: 0;
                justify-content: flex-end;
            }

            ::slotted([slot="host-tab"]) {
                display: inline-flex;
                align-items: center;
                gap: 0.375rem;
            }

            .editor {
                flex-grow: 1;
                min-height: 0;
                position: relative;
            }

            .host-panel {
                position: absolute;
                inset: 0;
                overflow: auto;
                padding: 0.5rem 0.75rem;
                color: var(--md-sys-color-on-surface);
            }

            .host-panel:focus-visible {
                outline: 2px solid var(--md-sys-color-primary);
                outline-offset: -2px;
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

            /* Both give up room long before the run state does: it is the message that changes. */
            .hint,
            .read-only {
                min-width: 0;
                flex-shrink: 100;
            }

            .hint,
            .read-only span {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .hint {
                visibility: hidden;
            }

            .show-escape-hint .hint {
                visibility: visible;
            }

            .read-only {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                color: var(--md-sys-color-primary);
            }

            .read-only md-icon {
                font-size: 1rem;
                width: 1rem;
                height: 1rem;
                flex-shrink: 0;
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

    /**
     * Whether the last thing to move focus was the keyboard. The escape hint is only of
     * use to someone who arrived by Tab and has to leave the same way, and :focus-visible
     * cannot tell us: it always matches a contenteditable, mouse or not.
     */
    private focusFromKeyboard = false;

    private onPointerDown = (): void => {
        this.focusFromKeyboard = false;
    };

    private onKeyDown = (): void => {
        this.focusFromKeyboard = true;
    };

    /**
     * Compacts the run buttons first and the slotted buttons second, each only when the
     * row does not fit otherwise. The row is the whole toolbar when the tabs leave room
     * for the compacted buttons, and a row of its own below the tabs when they do not.
     */
    private updateCompactButtons = (): void => {
        const toolbar = this.toolbarRef.value;
        const tabs = this.tabsRef.value;
        const buttons = this.buttonsRef.value;
        if (!toolbar || !tabs || !buttons) return;
        // The host restyles its slotted buttons when compact-slotted changes, so the width of each form is kept.
        const current = buttons.slottedWidth;
        if (current !== undefined) {
            if (this.compactSlotted) this.compactSlottedWidth = current;
            else this.labelledSlottedWidth = current;
        }
        const labelled = current === undefined ? undefined : this.labelledSlottedWidth;
        const compacted = current === undefined ? undefined : (this.compactSlottedWidth ?? 0);
        const width = toolbar.clientWidth;
        const tabsWidth = tabs.contentWidth;
        const room = tabsWidth + buttons.neededWidth(true, compacted) <= width ? width - tabsWidth : width;
        const labelledFits = buttons.neededWidth(false, labelled) <= room;
        const iconsFit = buttons.neededWidth(true, labelled) <= room;
        buttons.compact = !labelledFits;
        this.compactSlotted = !labelledFits && !iconsFit;
    };

    private onButtonsSlotChange = (): void => {
        this.labelledSlottedWidth = undefined;
        this.compactSlottedWidth = undefined;
        this.compactSlotted = false;
    };

    override connectedCallback(): void {
        super.connectedCallback();
        // Capture phase, on the document: the key that moves focus here is dispatched at
        // whatever had focus before, which is usually outside this component.
        document.addEventListener("pointerdown", this.onPointerDown, true);
        document.addEventListener("keydown", this.onKeyDown, true);
        if (this.hasUpdated) {
            this.observeHostTabLabel();
            if (this.toolbarWidthRef.value) this.toolbarObserver.observe(this.toolbarWidthRef.value);
        }
    }

    protected override firstUpdated(): void {
        if (this.toolbarWidthRef.value) this.toolbarObserver.observe(this.toolbarWidthRef.value);
        const dropZone = this.dropZoneRef.value;
        if (!dropZone) return;
        // Use capture phase so we intercept before CodeMirror handles the drop
        dropZone.addEventListener("dragover", this.onDragOver, true);
        dropZone.addEventListener("dragleave", this.onDragLeave, true);
        dropZone.addEventListener("drop", this.onDrop, true);
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener("pointerdown", this.onPointerDown, true);
        document.removeEventListener("keydown", this.onKeyDown, true);
        this.hostTabObserver.disconnect();
        this.toolbarObserver.disconnect();
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

    private hostTabElements(): Element[] {
        return this.hostTabSlotRef.value?.assignedElements({ flatten: true }) ?? [];
    }

    private readHostTabLabel(): void {
        const elements = this.hostTabElements();
        this.hostTabLabel =
            elements.length > 0 ? elements.map((el) => el.textContent?.trim() ?? "").join(" ") : undefined;
    }

    private observeHostTabLabel(): void {
        this.hostTabObserver.disconnect();
        for (const element of this.hostTabElements()) {
            this.hostTabObserver.observe(element, { subtree: true, childList: true, characterData: true });
        }
        this.readHostTabLabel();
    }

    private onHostTabSlotChange(): void {
        this.observeHostTabLabel();
        if (this.hostTabLabel === undefined && this.papyros.io.activeEditorTab === HOST_TAB) {
            this.papyros.io.activeEditorTab = CODE_TAB;
        }
    }

    /** Every panel stays mounted and only the active one is shown, so each keeps its scroll position and undo history. */
    private renderPanels(activeTab: EditorTabId, files: FileEntry[]): TemplateResult {
        // Sorted by name: the file list can arrive in another order, and moving a viewer remounts its editor.
        const sorted = [...files].sort((a, b) => (a.name < b.name ? -1 : 1));
        return html`
            <p-code .papyros=${this.papyros} ?hidden=${activeTab !== CODE_TAB}></p-code>
            ${repeat(
                sorted,
                (file) => file.name,
                (file) =>
                    html`<p-file-viewer
                        .papyros=${this.papyros}
                        .file=${file}
                        .active=${file.name === activeTab}
                    ></p-file-viewer>`,
            )}
            <div class="host-panel" tabindex="0" ?hidden=${activeTab !== HOST_TAB}>
                <slot name="host-tab-panel"></slot>
            </div>
        `;
    }

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
        // The code panel stands in for a host tab that has no label yet.
        const selected = this.papyros.io.activeEditorTab;
        const activeTab = selected === HOST_TAB && this.hostTabLabel === undefined ? CODE_TAB : selected;
        let panelLabel: string;
        if (activeTab === CODE_TAB) panelLabel = this.t("Papyros.editor_tab_code");
        else if (activeTab === HOST_TAB) panelLabel = this.hostTabLabel ?? "";
        else panelLabel = activeTab;

        return html`
            <div ${ref(this.dropZoneRef)} class="drop-zone ${this.dragOver ? "drag-over" : ""}">
                <div class="pane ${this.showEscapeHint && activeTab === CODE_TAB ? "show-escape-hint" : ""}">
                    <div class="toolbar" ${ref(this.toolbarRef)}>
                        <div class="toolbar-width" ${ref(this.toolbarWidthRef)}></div>
                        <p-editor-tabs
                            ${ref(this.tabsRef)}
                            @p-editor-tabs-resize=${this.updateCompactButtons}
                            .papyros=${this.papyros}
                            .files=${files}
                            ?host-tab=${this.hostTabLabel !== undefined}
                        >
                            <slot
                                ${ref(this.hostTabSlotRef)}
                                name="host-tab"
                                slot="host-tab"
                                @slotchange=${this.onHostTabSlotChange}
                            ></slot>
                        </p-editor-tabs>
                        <p-button-lint
                            ${ref(this.buttonsRef)}
                            @p-button-lint-resize=${this.updateCompactButtons}
                            .papyros=${this.papyros}
                        >
                            <slot name="buttons" @slotchange=${this.onButtonsSlotChange}></slot>
                        </p-button-lint>
                    </div>
                    <!-- The tabs live in another shadow root, so the panel is named directly instead of by aria-labelledby. -->
                    <div
                        class="editor"
                        role="tabpanel"
                        aria-label=${panelLabel}
                        @focusin=${() => (this.showEscapeHint = this.focusFromKeyboard)}
                        @focusout=${() => (this.showEscapeHint = false)}
                    >
                        ${this.renderPanels(activeTab, files)}
                    </div>
                    <div class="footer">
                        <p-run-state .papyros=${this.papyros}></p-run-state>
                        ${
                            // The editor is read-only while debugging, which CodeMirror only
                            // exposes through aria-readonly, so say so on screen too.
                            this.papyros.debugger.active
                                ? html`<span class="read-only" title=${this.t("Papyros.editor.read_only")}>
                                      <md-icon aria-hidden="true">${this.papyros.constants.icons.lock}</md-icon>
                                      <span>${this.t("Papyros.editor.read_only")}</span>
                                  </span>`
                                : html`<span
                                      class="hint"
                                      aria-hidden="true"
                                      title=${this.t("Papyros.editor.escape_hint")}
                                  >
                                      ${this.t("Papyros.editor.escape_hint")}
                                  </span>`
                        }
                    </div>
                </div>
            </div>
        `;
    }
}
