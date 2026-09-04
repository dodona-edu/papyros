import { customElement } from "lit/decorators.js";
import { PapyrosElement } from "../PapyrosElement";
import { RunState } from "../../state/Runner";
import { css, CSSResult, html, PropertyValues, TemplateResult } from "lit";
import "@material/web/progress/circular-progress";

@customElement("p-run-state")
export class RunStateEl extends PapyrosElement {
    static get styles(): CSSResult {
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

    // Always mounted so the aria-live region exists before content changes,
    // otherwise screen readers can miss the first announcement.
    protected override update(changedProperties: PropertyValues): void {
        this.toggleAttribute("empty", !this.papyros.runner.stateMessage);
        super.update(changedProperties);
    }

    protected override render(): TemplateResult {
        const message = this.papyros.runner.stateMessage;
        const showSpinner = !!message && ![RunState.Ready, RunState.Error].includes(this.papyros.runner.state);

        return html`
            <div role="status" aria-live="polite">
                ${showSpinner ? html`<md-circular-progress indeterminate aria-hidden="true"></md-circular-progress>` : ""}
                ${message}
            </div>
        `;
    }
}
