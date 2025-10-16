import { customElement } from "lit/decorators.js";
import { css, CSSResult, html, TemplateResult } from "lit";
import "../code_mirror/BatchInputEditor";
import { RunState } from "../../state/Runner";
import { PapyrosElement } from "../PapyrosElement";

@customElement("p-batch-input")
export class BatchInput extends PapyrosElement {
    static get styles(): CSSResult {
        return css`
            :host {
                width: 100%;
                height: 100%;
                overflow: auto;
                display: block;
            }
        `;
    }

    get usedLines(): number | undefined {
        if (this.papyros.debugger.active && this.papyros.debugger.debugUsedInputs !== undefined) {
            return this.papyros.debugger.debugUsedInputs;
        }
        return this.papyros.io.inputs.length;
    }

    get placeholder(): string {
        if (this.papyros.io.prompt) {
            return this.papyros.io.prompt;
        }
        return this.t("Papyros.input_placeholder.batch");
    }

    protected override render(): TemplateResult {
        return html`
            <p-batch-input-editor
                .value=${this.papyros.io.inputBuffer}
                .usedLines=${this.usedLines}
                .readOnly=${this.papyros.debugger.active && this.papyros.runner.state === RunState.Ready}
                .placeholder=${this.placeholder}
                .translations=${this.papyros.i18n.getTranslations("CodeMirror")}
                .theme=${this.papyros.constants.CodeMirrorTheme}
                @change=${(e: CustomEvent) => (this.papyros.io.inputBuffer = e.detail)}
            ></p-batch-input-editor>
        `;
    }
}
