import {customElement, property} from "lit/decorators.js";
import {PapyrosElement} from "./PapyrosElement";
import {html, TemplateResult} from "lit";

@customElement('p-button')
export class Button extends PapyrosElement {
    @property({ type: String })
    icon: string;

    protected override render(): TemplateResult {
        return html`
            <button>
                ${this.icon ? html`<span class="icon">${this.papyros.theme.icons[this.icon] || this.icon}</span>` : ''}
                <slot></slot>
            </button>
        `;
    }

}