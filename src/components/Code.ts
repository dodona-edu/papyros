import {html, LitElement, TemplateResult} from "lit";
import {StateController} from "@dodona/lit-state";
import "./code_mirror/CodeEditor"
import {property} from "lit/decorators.js";
import {papyros, Papyros} from "../state/Papyros";

export class Code extends LitElement {
    @property()
    public papyros: Papyros = papyros;

    constructor() {
        super();
        new StateController(this)
    }

    protected override render(): TemplateResult {
        return html`
            <p-code-editor
                .language=${this.papyros.runner.programmingLanguage}
                .debugMode=${this.papyros.debugger.active}
                .debugLine=${this.papyros.debugger.debugLine}
                .testCode=${this.papyros.runner.testCode}
                .value=${this.papyros.runner.code}
                .lintSource=${this.papyros.runner.lintSource}
                @change=${(e: CustomEvent) => this.papyros.runner.code = e.detail}
            ></p-code-editor>
        `
    }
}