import {customElement} from "lit/decorators.js";
import {css, html, TemplateResult} from "lit";
import {RunState} from "../../state/Runner";
import {PapyrosElement} from "../extras/PapyrosElement";
import {RunMode} from "../../Backend";
import "@material/web/button/filled-button";
import "@material/web/button/outlined-button";

@customElement('p-button-lint')
export class ButtonLint extends PapyrosElement {
    static get styles() {
        return css`
            :host {
                display: flex;
                justify-content: space-between;
                height: fit-content;
                padding: 0.5rem;
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
                    <md-outlined-button @click=${() => this.papyros.debugger.active = false}>
                        <span slot="icon">${this.papyros.theme.icons.stopDebug}</span>
                        ${this.t(`Papyros.debug.stop`)}
                    </md-outlined-button>`;
            } else {
                return [
                    html`
                    <md-filled-button @click=${() => this.papyros.runner.start(RunMode.Run)}>
                        <span slot="icon">${this.papyros.theme.icons[RunMode.Run]}</span>
                        ${this.t(`Papyros.run_modes.${RunMode.Run}`)}
                    </md-filled-button>`,
                    ...this.papyros.runner.runModes.map(mode => html`
                        <md-outlined-button @click=${() => this.papyros.runner.start(mode)}>
                            <span slot="icon">${this.papyros.theme.icons[mode]}</span>
                            ${this.t(`Papyros.run_modes.${mode}`)}
                        </md-outlined-button>`)
                ]
            }
        } else {
            return html`
                <md-filled-button @click=${() => this.papyros.runner.stop()}>
                    <span slot="icon">${this.papyros.theme.icons.stop}</span>
                    ${this.t(`Papyros.stop`)}
                </md-filled-button>`;
        }
    }

    protected override render(): TemplateResult {
        return html`
            <div class="buttons">${this.buttons}</div>
            <div class="buttons"><slot></slot></div>
        `;
    }
}