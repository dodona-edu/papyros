import { customElement } from "lit/decorators.js";
import { css, CSSResult, html, TemplateResult } from "lit";
import { FriendlyError, OutputEntry, OutputType } from "../state/InputOutput";
import { PapyrosElement } from "./PapyrosElement";
import "@material/web/icon/icon";

@customElement("p-output")
export class Output extends PapyrosElement {
    static get styles(): CSSResult {
        return css`
            :host {
                width: 100%;
                height: 100%;
                overflow: auto;
                display: block;
            }

            img {
                max-width: 100%;
                max-height: 300px;
                display: block;
                margin: 0.5rem 0;
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
                if (o.type === OutputType.img) {
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
        return this.outputs.map((o) => {
            if (o.type === OutputType.stdout) {
                return html`${o.content}`;
            } else if (o.type === OutputType.img) {
                return html`<img src="data:${o.contentType}, ${o.content}"></img>`;
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

    protected override render(): TemplateResult {
        if (this.outputs.length === 0) {
            return html`<pre class="place-holder">${this.t("Papyros.output_placeholder")}</pre>`;
        }

        return html`
            <pre>${this.renderedOutputs}</pre>
            ${this.showOverflowWarning
                ? html`
                      <p>
                          ${this.t("Papyros.output_overflow")}
                          <a href="${this.downloadOverflowUrl}" download="papyros_output.txt">
                              ${this.t("Papyros.output_overflow_download")}
                          </a>
                      </p>
                  `
                : html``}
        `;
    }
}
