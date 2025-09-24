import {customElement} from "lit/decorators.js";
import {PapyrosElement} from "../extras/PapyrosElement";
import {RunState} from "../../state/Runner";
import {css, html} from "lit";

@customElement("p-run-state")
export class RunStateEl extends PapyrosElement {
    static get styles() {
        return css`
            .spinner {
                border: 2px solid #f3f3f3; /* Light grey */
                border-top: 2px solid #3498db; /* Blue */
                border-radius: 50%;
                width: 16px;
                height: 16px;
                animation: spin 2s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
    }

    protected override render() {
        if (!this.papyros.runner.stateMessage) return null;

        return html`
            ${this.papyros.runner.state ===  RunState.Ready ? "" : html`
                <div class="spinner"></div>
            `}
            ${this.papyros.runner.stateMessage}
        `
    }
}