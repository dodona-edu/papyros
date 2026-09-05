import { customElement, property } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { CODE_TAB, FileEntry } from "../state/InputOutput";
import "./EditorTab";
import { EditorTab } from "./EditorTab";
import "./AddFileButton";
import { tabButtonStyles } from "./shared-styles";

@customElement("p-editor-tabs")
export class EditorTabs extends PapyrosElement {
    @property({ attribute: false })
    files: FileEntry[] = [];

    private codeTabRef: Ref<HTMLButtonElement> = createRef();

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
            }

            .tablist {
                display: flex;
                flex-direction: row;
                height: 100%;
            }

            ${tabButtonStyles}
        `;
    }

    /** Roving-tabindex navigation: moves focus only, the tab is opened with Enter or Space. */
    private focusTab(id: string): void {
        if (id === CODE_TAB) {
            this.codeTabRef.value?.focus();
        } else {
            const tabs = this.renderRoot.querySelectorAll<EditorTab>("p-editor-tab");
            Array.from(tabs)
                .find((t) => t.file.name === id)
                ?.focusTab();
        }
    }

    /** The id of the tab the event came from, which need not be the open one. */
    private eventTabId(e: KeyboardEvent): string {
        const path = e.composedPath();
        if (path[0] === this.codeTabRef.value) return CODE_TAB;
        const tab = path.find((n): n is EditorTab => n instanceof EditorTab);
        return tab?.file.name ?? this.papyros.io.activeEditorTab;
    }

    private onTablistKeydown(e: KeyboardEvent): void {
        // Only the tabs themselves navigate; the rename input and the tab controls keep their own keys.
        const originalTarget = e.composedPath()[0] as HTMLElement;
        if (originalTarget.getAttribute("role") !== "tab") return;

        const ids = [CODE_TAB, ...this.files.map((f) => f.name)];
        const currentIndex = Math.max(ids.indexOf(this.eventTabId(e)), 0);

        let nextIndex: number;
        switch (e.key) {
            case "ArrowRight":
                nextIndex = (currentIndex + 1) % ids.length;
                break;
            case "ArrowLeft":
                nextIndex = (currentIndex - 1 + ids.length) % ids.length;
                break;
            case "Home":
                nextIndex = 0;
                break;
            case "End":
                nextIndex = ids.length - 1;
                break;
            default:
                return;
        }

        e.preventDefault();
        this.focusTab(ids[nextIndex]);
    }

    protected override render(): TemplateResult {
        const activeTab = this.papyros.io.activeEditorTab;
        const debugActive = this.papyros.debugger.active;
        return html`
            <div
                class="tablist"
                role="tablist"
                aria-label=${this.t("Papyros.file_tabs")}
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
                ${this.files.map((f) => html`<p-editor-tab .papyros=${this.papyros} .file=${f}></p-editor-tab>`)}
            </div>
            ${debugActive ? "" : html`<p-add-file-button .papyros=${this.papyros}></p-add-file-button>`}
        `;
    }
}
