import {html, LitElement, TemplateResult} from "lit";
import {StateController} from "@dodona/lit-state";
import "./code_mirror/CodeEditor"
import {customElement, property} from "lit/decorators.js";
import {papyros, Papyros} from "../state/Papyros";

@customElement("p-code")
export class Code extends LitElement {
    controller = new StateController(this);
    @property()
    public papyros: Papyros = papyros;

    protected override render(): TemplateResult {
        return html`
            <p-code-editor
                .language=${this.papyros.runner.programmingLanguage}
                .debug=${this.papyros.debugger.active}
                .debugLine=${this.papyros.debugger.debugLine}
                .value=${this.papyros.runner.code}
                .lintSource=${this.papyros.runner.lintSource}
                @change=${(e: CustomEvent) => this.papyros.runner.code = e.detail}
            ></p-code-editor>
        `
    }
}