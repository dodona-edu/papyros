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
                .indentLength=${this.papyros.constants.indentationSize}
                .translations=${this.papyros.i18n.getTranslations("CodeMirror")}
                .theme=${this.papyros.constants.CodeMirrorTheme}
                .placeholder=${this.t("Papyros.code_placeholder", {programmingLanguage: this.papyros.runner.programmingLanguage})}
                .testLines=${this.papyros.test.testLines}
                .testTranslations=${this.papyros.i18n.getTranslations("Papyros.editor.test_code")}
                @edit-test-code=${() => this.papyros.test.editTestCode()}
                @remove-test-code=${() => this.papyros.test.testCode = undefined}
                @change=${(e: CustomEvent) => this.papyros.runner.code = e.detail}
            ></p-code-editor>
        `
    }
}