import { customElement, property } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, nothing, PropertyValues, TemplateResult } from "lit";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { CODE_TAB, EditorTabId, FileEntry, HOST_TAB } from "../state/InputOutput";
import "./EditorTab";
import { EditorTab } from "./EditorTab";
import "./AddFileButton";
import { tabButtonStyles } from "./shared-styles";
import { nextTabIndex } from "./tabs";

@customElement("p-editor-tabs")
export class EditorTabs extends PapyrosElement {
    @property({ attribute: false })
    files: FileEntry[] = [];

    /** Whether to show the tab the host supplies through the `host-tab` slot. */
    @property({ type: Boolean, attribute: "host-tab" })
    hostTab = false;

    /** Hides the add-file button and makes the tabs unrenamable and unclosable */
    @property({ type: Boolean })
    readonly = false;

    private codeTabRef: Ref<HTMLButtonElement> = createRef();
    private hostTabRef: Ref<HTMLButtonElement> = createRef();
    private resizeObserver = new ResizeObserver(() => this.dispatchEvent(new Event("p-editor-tabs-resize")));
    /**
     * Observing an element again starts a new observation with a notification of its own. An update
     * during a ResizeObserver callback (the code runner re-renders when it compacts the slotted
     * buttons) would then leave that notification undelivered, so each child is observed once.
     */
    private observedChildren = new Set<Element>();

    /** The width the tabs need, which is more than they get while they scroll. */
    public get contentWidth(): number {
        const rects = Array.from(this.renderRoot.children)
            .map((child) => child.getBoundingClientRect())
            .filter((rect) => rect.width > 0);
        if (rects.length === 0) return 0;
        const style = getComputedStyle(this);
        const width =
            Math.max(...rects.map((r) => r.right)) -
            Math.min(...rects.map((r) => r.left)) +
            parseFloat(style.paddingLeft) +
            parseFloat(style.paddingRight);
        return Math.ceil(width);
    }

    protected override updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        const children = new Set(Array.from(this.renderRoot.children));
        for (const child of this.observedChildren) {
            if (!children.has(child)) this.resizeObserver.unobserve(child);
        }
        for (const child of children) {
            if (!this.observedChildren.has(child)) this.resizeObserver.observe(child);
        }
        this.observedChildren = children;
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.resizeObserver.disconnect();
        this.observedChildren.clear();
    }

    static get styles(): CSSResult {
        return css`
            :host {
                display: flex;
                flex-direction: row;
                height: 2.25rem;
                flex-shrink: 0;
                padding: 0 0.125rem;
                /* Matches tabBarStyles; an inset shadow survives the clipping overflow-x imposes. */
                box-shadow: inset 0 -1px 0 var(--md-sys-color-outline-variant);
                background-color: var(--md-sys-color-surface);
                overflow-x: auto;
                scrollbar-width: none;
            }

            :host::-webkit-scrollbar {
                display: none;
            }

            .tablist {
                display: flex;
                flex-direction: row;
                height: 100%;
            }

            .divider {
                flex-shrink: 0;
                width: 1px;
                height: 1.25rem;
                margin: auto 0.25rem;
                background-color: var(--md-sys-color-outline-variant);
            }

            ${tabButtonStyles}
        `;
    }

    /** Roving-tabindex navigation: moves focus only, the tab is opened with Enter or Space. */
    private focusTab(id: EditorTabId): void {
        if (id === CODE_TAB) {
            this.codeTabRef.value?.focus();
        } else if (id === HOST_TAB) {
            this.hostTabRef.value?.focus();
        } else {
            const tabs = this.renderRoot.querySelectorAll<EditorTab>("p-editor-tab");
            Array.from(tabs)
                .find((t) => t.file.name === id)
                ?.focusTab();
        }
    }

    /** The id of the tab the event came from, which need not be the open one. */
    private eventTabId(e: KeyboardEvent): EditorTabId {
        const path = e.composedPath();
        if (path[0] === this.codeTabRef.value) return CODE_TAB;
        if (path[0] === this.hostTabRef.value) return HOST_TAB;
        const tab = path.find((n): n is EditorTab => n instanceof EditorTab);
        return tab?.file.name ?? this.papyros.io.activeEditorTab;
    }

    private onTablistKeydown(e: KeyboardEvent): void {
        // Only the tabs themselves navigate; the rename input and the tab controls keep their own keys.
        const originalTarget = e.composedPath()[0] as HTMLElement;
        if (originalTarget.getAttribute("role") !== "tab") return;

        const ids: EditorTabId[] = [CODE_TAB, ...this.files.map((f) => f.name)];
        if (this.hostTab) ids.push(HOST_TAB);
        const currentIndex = Math.max(ids.indexOf(this.eventTabId(e)), 0);

        const nextIndex = nextTabIndex(e.key, currentIndex, ids.length);
        if (nextIndex === undefined) return;

        e.preventDefault();
        this.focusTab(ids[nextIndex]);
    }

    protected override render(): TemplateResult {
        // The code panel stands in for a host tab that has no label yet.
        const selected = this.papyros.io.activeEditorTab;
        const activeTab = selected === HOST_TAB && !this.hostTab ? CODE_TAB : selected;
        const locked = this.readonly || this.papyros.debugger.active;
        return html`
            <div
                class="tablist"
                role="tablist"
                aria-label=${this.t("Papyros.file_tabs")}
                aria-owns=${this.hostTab ? "host-tab" : nothing}
                @keydown=${this.onTablistKeydown}
            >
                <button
                    ${ref(this.codeTabRef)}
                    class=${activeTab === CODE_TAB ? "active" : ""}
                    role="tab"
                    aria-selected=${activeTab === CODE_TAB ? "true" : "false"}
                    tabindex=${activeTab === CODE_TAB ? "0" : "-1"}
                    @click=${() => (this.papyros.io.activeEditorTab = CODE_TAB)}
                >
                    ${this.t("Papyros.editor_tab_code")}
                </button>
                ${this.files.map(
                    (f) => html`<p-editor-tab .papyros=${this.papyros} .file=${f} .readonly=${locked}></p-editor-tab>`,
                )}
            </div>
            ${locked ? "" : html`<p-add-file-button .papyros=${this.papyros}></p-add-file-button>`}
            ${
                // The add-file button sits between the file tabs and this tab, and a tablist may
                // only contain tabs, so the tablist claims this tab through aria-owns instead.
                this.hostTab
                    ? html`<span class="divider" aria-hidden="true"></span>
                          <button
                              ${ref(this.hostTabRef)}
                              id="host-tab"
                              class=${activeTab === HOST_TAB ? "active" : ""}
                              role="tab"
                              aria-selected=${activeTab === HOST_TAB ? "true" : "false"}
                              tabindex=${activeTab === HOST_TAB ? "0" : "-1"}
                              @click=${() => (this.papyros.io.activeEditorTab = HOST_TAB)}
                              @keydown=${this.onTablistKeydown}
                          >
                              <slot name="host-tab"></slot>
                          </button>`
                    : ""
            }
        `;
    }
}
