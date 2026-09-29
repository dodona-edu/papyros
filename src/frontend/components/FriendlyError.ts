import { customElement, property, state } from "lit/decorators.js";
import { css, CSSResult, html, nothing, PropertyValues, TemplateResult } from "lit";
import { FriendlyError } from "../state/InputOutput";
import { PapyrosElement } from "./PapyrosElement";

/**
 * A Python error: its name and message as the heading, with the traceback behind a
 * disclosure button.
 *
 * @element p-friendly-error
 */
@customElement("p-friendly-error")
export class FriendlyErrorElement extends PapyrosElement {
    static get styles(): CSSResult {
        return css`
            :host {
                display: block;
                /* Placed inside a <pre> by p-output, which would print this template's indentation */
                white-space: normal;
            }

            .title {
                font-weight: 700;
                white-space: pre-wrap;
                overflow-wrap: break-word;
            }

            .traceback-toggle {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                min-height: 24px;
                margin: 6px 0 0;
                padding: 0;
                border: 0;
                background: none;
                color: inherit;
                font: inherit;
                cursor: pointer;
            }

            .traceback-toggle:hover {
                text-decoration: underline;
            }

            .icon {
                display: inline-flex;
                flex: none;
            }

            .icon svg {
                width: 16px;
                height: 16px;
            }

            .traceback-body {
                margin-top: 6px;
                white-space: pre-wrap;
                overflow-wrap: break-word;
            }
        `;
    }

    /**
     * The error to show
     */
    @property({ attribute: false })
    error: FriendlyError = { name: "" };

    @state()
    private open = false;

    protected override willUpdate(changedProperties: PropertyValues): void {
        super.willUpdate(changedProperties);
        if (changedProperties.has("error")) {
            this.open = false;
        }
    }

    private get heading(): string {
        const { name, what } = this.error;
        if (!what) {
            return name;
        }
        return what.startsWith(name) ? what : `${name}: ${what}`;
    }

    protected override render(): TemplateResult {
        const traceback = this.error.traceback;
        // One line on purpose: the body is white-space: pre-wrap, so wrapping the template
        // would print its own indentation.
        const body = html`<div class="traceback-body" id="traceback">${traceback}</div>`;
        // Only the title carries role="alert": with the whole block as the alert, expanding the
        // traceback drops it inside the live region and assistive technology re-announces the lot.
        return html`
            <div class="title" role="alert">${this.heading}</div>
            ${
                traceback
                    ? html`
                          <button
                              class="traceback-toggle"
                              aria-expanded=${this.open ? "true" : "false"}
                              aria-controls="traceback"
                              @click=${() => (this.open = !this.open)}
                          >
                              <span class="icon" aria-hidden="true"
                                  >${this.open ? this.papyros.constants.icons.menuDown : this.papyros.constants.icons.menuRight}</span
                              >
                              ${
                                  this.open
                                      ? this.t("Papyros.playground.hide_traceback")
                                      : this.t("Papyros.playground.show_traceback")
                              }
                          </button>
                          ${this.open ? body : nothing}
                      `
                    : nothing
            }
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "p-friendly-error": FriendlyErrorElement;
    }
}
