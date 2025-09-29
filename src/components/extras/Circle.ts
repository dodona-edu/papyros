import { customElement } from "lit/decorators.js";
import { css, html, TemplateResult } from "lit";
import { CSSResultGroup } from "@lit/reactive-element/css-tag.js";

@customElement("p-circle")
export class Circle extends HTMLElement {
    static get styles(): CSSResultGroup {
        return css`
            :host {
                display: inline-block;
                width: 1rem;
                height: 1rem;
                border-radius: 50%;
                background-color: var(--papyros-primary, #6200ee);
                color: var(--papyros-on-primary, #ffffff);
            }
        `
    }

    protected override render(): TemplateResult {
        return html`<slot></slot>`;
    }
}