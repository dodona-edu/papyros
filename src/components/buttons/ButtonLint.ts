import {customElement} from "lit/decorators.js";
import {css, html, TemplateResult} from "lit";
import {RunState} from "../../state/Runner";
import "./RunButton";
import "./StopButton";
import "./StopDebugButton";
import {PapyrosElement} from "../helpers/PapyrosElement";

@customElement('p-button-lint')
export class ButtonLint extends PapyrosElement {
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
            if(this.papyros.debugger.active) {
                return html`<p-stop-debug-button .papyros=${this.papyros}></p-stop-debug-button>`;
            } else {
                return this.papyros.runner.runModes.map(mode => html`<p-run-button .mode=${mode} .papyros=${this.papyros}></p-run-button>`);
            }
        } else {
            return html`<p-stop-button .papyros=${this.papyros}></p-stop-button>`;
        }
    }

    protected override render(): TemplateResult {
        return html`
            <div class="buttons">${this.buttons}</div>
            <div class="buttons"><slot></slot></div>
        `;
    }
}