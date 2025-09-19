import {html, LitElement, TemplateResult} from "lit";
import {StateController} from "@dodona/lit-state";
import "./code_mirror/CodeEditor"
import {property} from "lit/decorators.js";
import {state, State} from "../state/State";

export class Code extends LitElement {
    @property()
    public state: State = state;

    constructor() {
        super();
        new StateController(this)
    }

    protected override render(): TemplateResult {
        return html`
            <p-code-editor
                .language=${this.state.programmingLanguage}
                .debugMode=${this.state.debugMode}
                .debugLine=${this.state.debugLine}
                .testCode=${this.state.testCode}
                .value=${this.state.code}
                @change=${(e: CustomEvent) => this.state.code = e.detail}
            ></p-code-editor>
        `
    }
}