import { customElement, property } from "lit/decorators.js";
import { PapyrosElement } from "./PapyrosElement";
import { css, CSSResult, html, TemplateResult } from "lit";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { CODE_TAB, FileEntry } from "../state/InputOutput";
import { EditorTab } from "./EditorTab";
import "./AddFileButton";
import { tabButtonStyles } from "./shared-styles";

@customElement("p-editor-tabs")
export class EditorTabs extends PapyrosElement {
    @property({ attribute: false })
    files: FileEntry[] = [];

    private codeTabRef: Ref<HTMLButtonElement> = createRef();
    private readonly tabElements = new Map<string, EditorTab>();

    static get styles(): CSSResult {
        return css`
            :host {
                display: flex;
                flex-direction: row;
                gap: 0.25rem;
                padding: 0.25rem 0.25rem 0;
                background-color: var(--md-sys-color-surface-container);
                border-radius: 0.5rem 0.5rem 0 0;
                max-height: 2.5rem;
                flex-shrink: 0;
                overflow-x: auto;
            }

            .tablist {
                display: flex;
                flex-direction: row;
                gap: 0.25rem;
            }

            ${tabButtonStyles}
        `;
    }

    /** Roving-tabindex navigation: moves focus and activates the target tab (automatic activation). */
    private activateTab(id: string): void {
        this.papyros.io.activeEditorTab = id;
        if (id === CODE_TAB) {
            this.codeTabRef.value?.focus();
        } else {
            this.tabElements.get(id)?.focusTab();
        }
    }

    private onTablistKeydown(e: KeyboardEvent): void {
        // Ignore arrow/home/end presses while typing in the rename input nested in a tab.
        const originalTarget = e.composedPath()[0] as HTMLElement;
        if (originalTarget.tagName === "INPUT") return;

        const ids = [CODE_TAB, ...this.files.map((f) => f.name)];
        const currentIndex = Math.max(ids.indexOf(this.papyros.io.activeEditorTab), 0);

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
        this.activateTab(ids[nextIndex]);
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
                ${this.files.map(
                    (f) =>
                        html`<p-editor-tab
                            .papyros=${this.papyros}
                            .file=${f}
                            ${ref((el) => {
                                if (el) this.tabElements.set(f.name, el as EditorTab);
                                else this.tabElements.delete(f.name);
                            })}
                        ></p-editor-tab>`,
                )}
            </div>
            ${debugActive ? "" : html`<p-add-file-button .papyros=${this.papyros}></p-add-file-button>`}
        `;
    }
}
