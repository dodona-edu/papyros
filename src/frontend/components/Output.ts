import { customElement } from "lit/decorators.js";
import { css, CSSResult, html, TemplateResult } from "lit";
import { FriendlyError, OutputEntry, OutputTab, OutputType, OUTPUT_TAB, TURTLE_TAB } from "../state/InputOutput";
import { PapyrosElement } from "./PapyrosElement";
import { tabBarStyles, tabButtonStyles } from "./shared-styles";
import { TurtlePatch, TurtleSvgBuilder } from "../state/TurtleSvg";
import "@material/web/icon/icon";

@customElement("p-output")
export class Output extends PapyrosElement {
    static get styles(): CSSResult {
        return css`
            :host {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                border: 1px solid var(--md-sys-color-outline-variant);
                border-radius: 0.625rem;
                background-color: var(--md-sys-color-surface);
                overflow: hidden;
                box-sizing: border-box;
            }

            ${tabBarStyles}

            .content {
                flex: 1;
                overflow: auto;
                container-type: size;
                padding: 0.625rem 0.875rem;
                background-color: var(--md-sys-color-surface-container-highest);
            }

            .content:focus-visible {
                outline: 2px solid var(--md-sys-color-primary);
                outline-offset: -2px;
            }

            .content.turtle {
                padding: 0;
                background-color: transparent;
            }

            img {
                max-width: 100%;
                max-height: 300px;
                display: block;
                margin: 0.5rem 0;
            }

            img.turtle {
                max-width: 100cqw;
                max-height: 100cqh;
                margin: 0;
                box-sizing: border-box;
                background-color: var(--md-sys-color-surface-container-highest);
                border: 1px solid var(--md-sys-color-outline-variant);
            }

            .turtle-placeholder {
                width: 400px;
                height: 400px;
                max-width: 100cqw;
                max-height: 100cqh;
                margin: 0;
                background-color: var(--md-sys-color-surface-container-highest);
                border: 1px solid var(--md-sys-color-outline-variant);
            }

            pre {
                font-family: monospace;
                margin: 0;
            }

            .error {
                color: var(--md-sys-color-error);
            }

            .place-holder {
                color: var(--md-sys-color-on-surface-variant);
            }

            .visually-hidden {
                position: absolute;
                width: 1px;
                height: 1px;
                overflow: hidden;
                clip: rect(0 0 0 0);
                white-space: nowrap;
            }

            md-icon {
                vertical-align: bottom;
            }

            ${tabButtonStyles}
        `;
    }

    /** Replays the turtle patches; kept across renders so following a run stays incremental. */
    private turtleSvg = new TurtleSvgBuilder();

    private get maxOutputLength(): number {
        if (this.papyros.debugger.active && this.papyros.debugger.debugOutputs !== undefined) {
            return this.papyros.debugger.debugOutputs;
        }

        return this.papyros.constants.maxOutputLength;
    }

    get outputs(): OutputEntry[] {
        return this.papyros.io.output.slice(0, this.maxOutputLength);
    }

    get overflow(): OutputEntry[] {
        return this.papyros.io.output.slice(this.maxOutputLength);
    }

    get showOverflowWarning(): boolean {
        return !this.papyros.debugger.active && this.papyros.io.output.length > this.maxOutputLength;
    }

    get downloadOverflowUrl(): string {
        const blob = new Blob(
            this.overflow.map((o) => {
                if (o.type === OutputType.img || o.type === OutputType.turtle) {
                    return `[Image output of type ${o.contentType} omitted]\n`;
                } else if (o.type === OutputType.stdout) {
                    return o.content as string;
                } else if (o.type === OutputType.stderr) {
                    if (typeof o.content === "string") {
                        return `Error: ${o.content}\n`;
                    } else {
                        const errorObject = o.content as FriendlyError;
                        let errorString = `Error: ${errorObject.name}\nInfo: ${errorObject.info}\nTraceback: ${errorObject.traceback}\n`;
                        if (errorObject.where) {
                            errorString += `Where: ${errorObject.where.trim()}\n`;
                        }
                        if (errorObject.what) {
                            errorString += `What: ${errorObject.what.trim()}\n`;
                        }
                        if (errorObject.why) {
                            errorString += `Why: ${errorObject.why.trim()}\n`;
                        }
                        return errorString;
                    }
                } else {
                    return "[Unsupported output type omitted]\n";
                }
            }),
            { type: "text/plain" },
        );

        return URL.createObjectURL(blob);
    }

    get renderedOutputs(): TemplateResult[] {
        if (this.papyros.io.activeOutputTab === TURTLE_TAB) {
            // Replay every patch within this.outputs (which is sliced by the debugger's
            // current step via maxOutputLength) — so stepping the debugger shows the
            // drawing build up.
            const patches = this.outputs
                .filter((o) => o.type === OutputType.turtle)
                .map((o) => o.content as TurtlePatch);
            const svg = this.turtleSvg.build(patches);
            return svg === undefined
                ? []
                : [
                      html`<img
                          class="turtle"
                          src="data:image/svg+xml,${encodeURIComponent(svg)}"
                          alt=${this.t("Papyros.turtle_alt")}
                      />`,
                  ];
        }
        const outputsToRender: OutputEntry[] = this.outputs.filter((o) => o.type !== OutputType.turtle);
        return outputsToRender.map((o) => {
            if (o.type === OutputType.stdout) {
                return html`${o.content}`;
            } else if (o.type === OutputType.img) {
                const mimeType = o.contentType ?? "image/png";
                return html`<img src="data:${mimeType},${o.content as string}" alt=${this.t("Papyros.image_alt")} />`;
            } else if (o.type === OutputType.stderr) {
                if (typeof o.content === "string") {
                    return html`<span class="error"
                        ><span class="visually-hidden">${this.t("Papyros.error_prefix")}</span>${o.content}</span
                    >`;
                } else {
                    const errorObject = o.content as FriendlyError;
                    const errorHTML = [
                        // an array to avoid unintentional spaces/newlines
                        html`<md-icon title="${errorObject.info}" aria-label="${errorObject.info}" role="img"
                                >${this.papyros.constants.icons.help}</md-icon
                            >${errorObject.name} traceback:`,
                        "\n",
                        html`<md-icon title="${errorObject.traceback}" aria-label="${errorObject.traceback}" role="img"
                            >${this.papyros.constants.icons.info}</md-icon
                        >`,
                        html`<span class="where">${errorObject.where?.trim()}</span>`,
                    ];
                    if (errorObject.what) {
                        errorHTML.push("\n", html`<span class="what">${errorObject.what.trim()}</span>`);
                    }
                    if (errorObject.why) {
                        errorHTML.push("\n", html`<span class="why">${errorObject.why.trim()}</span>`);
                    }
                    return html`<span class="error">${errorHTML}</span>`;
                }
            } else {
                return html``; // unsupported output type
            }
        });
    }

    private get showTurtleTab(): boolean {
        return this.papyros.io.hasTurtleOutput || this.papyros.io.activeOutputTab === TURTLE_TAB;
    }

    private get visibleTabs(): OutputTab[] {
        return this.showTurtleTab ? [OUTPUT_TAB, TURTLE_TAB] : [OUTPUT_TAB];
    }

    /** Standard ARIA tabs pattern: arrow keys move focus and select in one step. */
    private handleTabsKeydown(e: KeyboardEvent): void {
        const tabs = this.visibleTabs;
        const currentIndex = tabs.indexOf(this.papyros.io.activeOutputTab);
        let nextIndex: number;
        switch (e.key) {
            case "ArrowLeft":
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                break;
            case "ArrowRight":
                nextIndex = (currentIndex + 1) % tabs.length;
                break;
            case "Home":
                nextIndex = 0;
                break;
            case "End":
                nextIndex = tabs.length - 1;
                break;
            default:
                return;
        }
        e.preventDefault();
        const nextTab = tabs[nextIndex];
        this.papyros.io.selectOutputTab(nextTab);
        this.updateComplete.then(() => {
            this.renderRoot.querySelector<HTMLElement>(`#tab-${nextTab}`)?.focus();
        });
    }

    private renderTabs(): TemplateResult {
        const activeTab = this.papyros.io.activeOutputTab;
        return html`
            <div
                class="tab-bar"
                role="tablist"
                aria-label=${this.t("Papyros.output_tabs")}
                @keydown=${this.handleTabsKeydown}
            >
                <button
                    id="tab-output"
                    role="tab"
                    aria-selected=${activeTab === OUTPUT_TAB}
                    aria-controls="output-panel"
                    tabindex=${activeTab === OUTPUT_TAB ? 0 : -1}
                    class=${activeTab === OUTPUT_TAB ? "active" : ""}
                    @click=${() => this.papyros.io.selectOutputTab(OUTPUT_TAB)}
                >
                    ${this.t("Papyros.output_tab_output")}
                </button>
                ${
                    this.showTurtleTab
                        ? html`
                              <button
                                  id="tab-turtle"
                                  role="tab"
                                  aria-selected=${activeTab === TURTLE_TAB}
                                  aria-controls="output-panel"
                                  tabindex=${activeTab === TURTLE_TAB ? 0 : -1}
                                  class=${activeTab === TURTLE_TAB ? "active" : ""}
                                  @click=${() => this.papyros.io.selectOutputTab(TURTLE_TAB)}
                              >
                                  ${this.t("Papyros.output_tab_turtle")}
                              </button>
                          `
                        : html``
                }
            </div>
        `;
    }

    protected override render(): TemplateResult {
        const activeTab = this.papyros.io.activeOutputTab;
        const rendered = this.renderedOutputs;
        const showPlaceholder = activeTab === OUTPUT_TAB && rendered.length === 0;
        const showTurtlePlaceholder = activeTab === TURTLE_TAB && rendered.length === 0;
        const showOverflow = activeTab === OUTPUT_TAB && this.showOverflowWarning;
        return html`
            ${this.renderTabs()}
            <div
                class="content ${activeTab === TURTLE_TAB ? "turtle" : ""}"
                id="output-panel"
                role="tabpanel"
                aria-labelledby="tab-${activeTab}"
                tabindex="0"
            >
                ${
                    showPlaceholder
                        ? html`<pre class="place-holder">${this.t("Papyros.output_placeholder")}</pre>`
                        : showTurtlePlaceholder
                          ? html`<div class="turtle-placeholder"></div>`
                          : activeTab === OUTPUT_TAB
                            ? html`<pre role="log" aria-live="polite" aria-relevant="additions text">${rendered}</pre>`
                            : html`<pre>${rendered}</pre>`
                }
                ${
                    showOverflow
                        ? html`
                              <p>
                                  ${this.t("Papyros.output_overflow")}
                                  <a href="${this.downloadOverflowUrl}" download="papyros_output.txt">
                                      ${this.t("Papyros.output_overflow_download")}
                                  </a>
                              </p>
                          `
                        : html``
                }
            </div>
        `;
    }
}
