import {css, html, TemplateResult} from "lit";
import "../code_mirror/CodeEditor"
import {customElement} from "lit/decorators.js";
import {PapyrosElement} from "../extras/PapyrosElement";

@customElement("p-code")
export class Code extends PapyrosElement {
    static get styles() {
        return css`
            :host {
                width: 100%;
                height: 100%;
            }
        `
    }

    protected override render(): TemplateResult {
        return html`
            <p-code-editor
                .programmingLanguage=${this.papyros.runner.programmingLanguage}
                .debug=${this.papyros.debugger.active}
                .debugLine=${this.papyros.debugger.debugLine}
                .value=${this.papyros.runner.code}
                .lintingSource=${this.papyros.runner.lintSource.bind(this.papyros.runner)}
                .indentLength=${this.papyros.theme.indentationSize}
                @change=${(e: CustomEvent) => this.papyros.runner.code = e.detail}
            ></p-code-editor>
        `
    }
}