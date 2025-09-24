import {customElement} from "lit/decorators.js";
import {css, html, TemplateResult} from "lit";
import {RunState} from "../../state/Runner";
import "../extras/Button";
import {PapyrosElement} from "../extras/PapyrosElement";
import {t} from "../../util/Util";

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
                return html`
                    <p-button .papyros=${this.papyros} 
                              .icon="stopDebug"
                              @click=${() => this.papyros.debugger.active = false}>
                        ${t(`Papyros.debug.stop`)}
                    </p-button>`;
            } else {
                return this.papyros.runner.runModes.map(mode => html`
                    <p-button .papyros=${this.papyros}
                              .icon=${mode}
                              @click=${() => this.papyros.runner.start(mode)}>
                        ${t(`Papyros.run_modes.${mode}`)}
                    </p-button>`);
            }
        } else {
            return html`
                <p-button .papyros=${this.papyros}
                          .icon="stop"
                          @click=${() => this.papyros.runner.stop()}>
                    ${t(`Papyros.stop`)}
                </p-button>`;
        }
    }

    protected override render(): TemplateResult {
        return html`
            <div class="buttons">${this.buttons}</div>
            <div class="buttons"><slot></slot></div>
        `;
    }
}