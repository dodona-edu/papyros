import {customElement, property} from "lit/decorators.js";
import {css, html, LitElement, TemplateResult} from "lit";
import {papyros, Papyros} from "../../state/Papyros";
import {RunState} from "../../state/Runner";
import "./RunButton";
import "./StopButton";
import "./StopDebugButton";

@customElement('p-button-lint')
export class ButtonLint extends LitElement {
    @property()
    papyros: Papyros = papyros;

    static get styles() {
        return css`
            :host {
                display: flex;
                justify-content: space-between;
            }
            
            .buttons {
                display: flex;
                gap: 0.5rem;
            }
        `
    }

    get buttons(): TemplateResult | TemplateResult[] {
        if(this.papyros.runner.state === RunState.Ready) {
            if(this.papyros.debug.active) {
                return html`<p-stop-debug-button></p-stop-debug-button>`;
            } else {
                return this.papyros.runner.runModes.map(mode => html`<p-run-button .mode=${mode}></p-run-button>`);
            }
        } else {
            return html`<p-stop-button></p-stop-button>`;
        }
    }

    protected override render(): TemplateResult {
        return html`
            <div class="buttons">${this.buttons}</div>
            <div class="buttons"><slot></slot></div>
        `;
    }
}