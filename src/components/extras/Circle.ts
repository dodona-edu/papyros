import { customElement } from "lit/decorators.js";
import { css, CSSResult, html, LitElement, TemplateResult } from "lit";

@customElement("p-circle")
export class Circle extends LitElement {
    static get styles(): CSSResult {
        return css`
            :host {
                display: inline-block;
                width: 1rem;
                height: 1rem;
                border-radius: 50%;
                background-color: var(--md-sys-color-error-container);
                color: var(--md-sys-color-on-error-container);
            }
        `
    }

    protected override render(): TemplateResult {
        return html`<slot></slot>`;
    }
}