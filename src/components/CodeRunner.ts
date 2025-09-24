import {customElement} from "lit/decorators.js";
import {PapyrosElement} from "./extras/PapyrosElement";
import {css, html, TemplateResult} from "lit";
import "./code_runner/Code";
import "./code_runner/RunState";
import "./code_runner/ButtonLint";

@customElement('p-code-runner')
export class CodeRunner extends PapyrosElement {
    static get styles() {
        return css`
            :host {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            div {
                flex-grow: 1;
                min-height: 0;
            }
        `
    }

    protected override render(): TemplateResult {
        return html`
            <div>
                <p-code .papyros=${this.papyros}></p-code>
                <p-run-state .papyros=${this.papyros}></p-run-state>
            </div>
            <p-button-lint .papyros=${this.papyros}>
                <slot name="buttons"></slot>
            </p-button-lint>
        `
    }

}