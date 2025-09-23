import {customElement} from "lit/decorators.js";
import {PapyrosElement} from "./helpers/PapyrosElement";
import {html, TemplateResult} from "lit";
import "./helpers/Code";
import "./helpers/RunState";
import "./buttons/ButtonLint";

@customElement('p-code-runner')
export class CodeRunner extends PapyrosElement {
    protected override render(): TemplateResult {
        return html`
            <div>
                <p-code .papyros=${this.papyros}></p-code>
                <p-run-state .papyros=${this.papyros}></p-run-state>
            </div>
            <p-button-lint .papyros=${this.papyros}></p-button-lint>
        `
    }

}