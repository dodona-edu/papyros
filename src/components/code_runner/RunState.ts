import { customElement } from "lit/decorators.js";
import { PapyrosElement } from "../extras/PapyrosElement";
import { RunState } from "../../state/Runner";
import { css, html, TemplateResult } from "lit";
import "@material/web/progress/circular-progress";
import { CSSResultGroup } from "@lit/reactive-element/css-tag.js";

@customElement("p-run-state")
export class RunStateEl extends PapyrosElement {
    static get styles(): CSSResultGroup {
        return css`
            :host {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            md-circular-progress {
                --md-circular-progress-size: 2rem;
            }
        `;
    }

    protected override render(): TemplateResult {
        if (!this.papyros.runner.stateMessage) return html``;

        return html`
            ${this.papyros.runner.state ===  RunState.Ready ? "" : html`
                <md-circular-progress indeterminate></md-circular-progress>
            `}
            ${this.papyros.runner.stateMessage}
        `
    }
}