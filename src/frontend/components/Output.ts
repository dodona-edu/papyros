import { customElement } from "lit/decorators.js";
import { css, CSSResult, html, TemplateResult } from "lit";
import { FriendlyError, OutputEntry, OutputType, OUTPUT_TAB, TURTLE_TAB } from "../state/InputOutput";
import { PapyrosElement } from "./PapyrosElement";
import { tabButtonStyles } from "./shared-styles";
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
            }

            .tabs {
                display: flex;
                flex-direction: row;
                gap: 0.25rem;
                padding-top: 0.25rem;
                flex-shrink: 0;
                position: relative;
                z-index: 1;
            }

            .content {
                flex: 1;
                overflow: auto;
                container-type: size;
                padding: 0.75rem;
                background-color: var(--md-sys-color-surface-container-highest);
            }

            .content.turtle {
                margin-top: -1px;
                padding: 0;
                background-color: transparent;
            }

            img {
                max-width: 100%;
                max-height: 300px;
                display: block;
                margin: 0.5rem 0;
            }

            img.turtle,
            .turtle-placeholder {
                width: min(100cqw, 100cqh);
                height: min(100cqw, 100cqh);
                max-width: 100%;
                max-height: 100%;
                margin: 0;
                box-sizing: border-box;
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
                color: var(--md-sys-color-on-surface);
                opacity: 0.5;
            }

            md-icon {
                vertical-align: bottom;
            }

            ${tabButtonStyles}
        `;
    }

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
        let outputsToRender: OutputEntry[];
        const isTurtle = (o: OutputEntry): boolean => o.type === OutputType.turtle;
        if (this.papyros.io.activeOutputTab === TURTLE_TAB) {
            // Turtle tab: only the latest snapshot. Intermediate frames from sleep/debug
            // are kept in the output array (so the debugger slider can step through them) but
            // only the current one should be visible.
            const lastIdx = this.outputs.findLastIndex(isTurtle);
            outputsToRender = lastIdx >= 0 ? [this.outputs[lastIdx]] : [];
        } else {
            // Output tab: everything except turtle snapshots.
            outputsToRender = this.outputs.filter((o) => !isTurtle(o));
        }
        return outputsToRender.map((o) => {
            if (o.type === OutputType.stdout) {
                return html`${o.content}`;
            } else if (o.type === OutputType.img) {
                const mimeType = o.contentType?.replace(/^img\//, "image/") ?? "image/png";
                return html`<img src="data:${mimeType},${o.content}"></img>`;
            } else if (o.type === OutputType.turtle) {
                const mimeType = o.contentType ?? "image/svg+xml;base64";
                return html`<img class="turtle" src="data:${mimeType},${o.content}"></img>`;
            } else if (o.type === OutputType.stderr) {
                if (typeof o.content === "string") {
                    return html`<span class="error">${o.content}</span>`;
                } else {
                    const errorObject = o.content as FriendlyError;
                    const errorHTML = [
                        // an array to avoid unintentional spaces/newlines
                        html`<md-icon title="${errorObject.info}"> ${this.papyros.constants.icons.help} </md-icon>
                            ${errorObject.name} traceback:
                            <md-icon title="${errorObject.traceback}">
                                ${this.papyros.constants.icons.info}
                            </md-icon> `,
                        html`<span class="where">${errorObject.where?.trim()}</span> `,
                    ];
                    if (errorObject.what) {
                        errorHTML.push(html`<span class="what">${errorObject.what.trim()}</span> `);
                    }
                    if (errorObject.why) {
                        errorHTML.push(html`<span class="why">${errorObject.why.trim()}</span> `);
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

    private renderTabs(): TemplateResult {
        const activeTab = this.papyros.io.activeOutputTab;
        return html`
            <div class="tabs">
                <button
                    class=${activeTab === OUTPUT_TAB ? "active" : ""}
                    @click=${() => this.papyros.io.selectOutputTab(OUTPUT_TAB)}
                >
                    ${this.t("Papyros.output_tab_output")}
                </button>
                ${this.showTurtleTab
                    ? html`
                          <button
                              class=${activeTab === TURTLE_TAB ? "active" : ""}
                              @click=${() => this.papyros.io.selectOutputTab(TURTLE_TAB)}
                          >
                              ${this.t("Papyros.output_tab_turtle")}
                          </button>
                      `
                    : html``}
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
            <div class="content ${activeTab === TURTLE_TAB ? "turtle" : ""}">
                ${showPlaceholder
                    ? html`<pre class="place-holder">${this.t("Papyros.output_placeholder")}</pre>`
                    : showTurtlePlaceholder
                      ? html`<div class="turtle-placeholder"></div>`
                      : html`<pre>${rendered}</pre>`}
                ${showOverflow
                    ? html`
                          <p>
                              ${this.t("Papyros.output_overflow")}
                              <a href="${this.downloadOverflowUrl}" download="papyros_output.txt">
                                  ${this.t("Papyros.output_overflow_download")}
                              </a>
                          </p>
                      `
                    : html``}
            </div>
        `;
    }
}
