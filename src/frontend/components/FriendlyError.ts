import { customElement, property, state } from "lit/decorators.js";
import { css, CSSResult, html, nothing, PropertyValues, TemplateResult } from "lit";
import { FriendlyError } from "../state/InputOutput";
import { PapyrosElement } from "./PapyrosElement";

/**
 * A Python error: its name and message as the heading and the place in the user's code
 * where it happened, with an explanation of the error type and the full traceback behind
 * a disclosure button.
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

            .where,
            .info,
            .traceback {
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

    /**
     * Announce the heading as an alert. Leave it off inside a live region, which
     * announces the error already.
     */
    @property({ type: Boolean })
    alert = false;

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
        const { info, traceback } = this.error;
        // `where` starts at the user's own code; `traceback` also lists Papyros' internal frames
        const where = this.error.where?.trim();
        // Each text sits on one line on purpose: it is white-space: pre-wrap, so wrapping the
        // template would print its own indentation. The body is hidden rather than left out
        // while collapsed, so expanding it adds nothing to a live region around this element.
        return html`
            <div class="title" role=${this.alert ? "alert" : nothing}>${this.heading}</div>
            ${where ? html`<div class="where">${where}</div>` : nothing}
            ${
                info || traceback
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
                              ${this.open ? this.t("Papyros.traceback.hide") : this.t("Papyros.traceback.show")}
                          </button>
                          <div class="traceback-body" id="traceback" ?hidden=${!this.open}>
                              ${info ? html`<div class="info">${info.trim()}</div>` : nothing}
                              ${traceback ? html`<div class="traceback">${traceback}</div>` : nothing}
                          </div>
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
