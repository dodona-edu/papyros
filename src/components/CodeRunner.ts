import {customElement} from "lit/decorators.js";
import {PapyrosElement} from "./extras/PapyrosElement";
import {html, TemplateResult} from "lit";
import "./code_runner/Code";
import "./code_runner/RunState";
import "./code_runner/ButtonLint";

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