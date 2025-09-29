import { customElement, property } from "lit/decorators.js";
import { css, CSSResult, html, TemplateResult } from "lit";
import "../code_mirror/BatchInputEditor";
import { RunState } from "../../state/Runner";
import { PapyrosElement } from "../PapyrosElement";

@customElement("p-batch-input")
export class BatchInput extends PapyrosElement {
    @property({ state: true })
        buffer: string = "";
    unsubscribe: () => void = () => {};

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
        if(this.papyros.debugger.active && this.papyros.debugger.debugUsedInputs !== undefined) {
            return this.papyros.debugger.debugUsedInputs;
        }
        return this.papyros.io.inputs.length;
    }

    /**
     * All lines except the last one that has not (yet) been terminated by a newline
     */
    get lines(): string[] {
        return this.buffer.split("\n").slice(0,-1);
    }

    get nextLine(): string | undefined {
        if (this.usedLines !== undefined && this.lines.length > this.usedLines) {
            return this.lines[this.usedLines];
        }
        return undefined;
    }

    get placeholder(): string {
        if(this.papyros.io.prompt) {
            return this.papyros.io.prompt;
        }
        return this.t("Papyros.input_placeholder.batch")
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.unsubscribe = this.papyros.io.subscribe(() => this.provideInput(), "awaitingInput");
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.unsubscribe();
    }

    provideInput(): void {
        if(this.papyros.io.awaitingInput && this.nextLine !== undefined) {
            this.papyros.io.provideInput(this.nextLine);
        }
    }

    protected override render(): TemplateResult {
        return html`
            <p-batch-input-editor
                .value=${this.buffer}
                .usedLines=${this.usedLines}
                .readOnly=${this.papyros.debugger.active && this.papyros.runner.state === RunState.Ready}
                .placeholder=${this.placeholder}
                .translations=${this.papyros.i18n.getTranslations("CodeMirror")}
                .theme=${this.papyros.constants.CodeMirrorTheme}
                @change=${(e: CustomEvent) => {
        this.buffer = e.detail;
        this.provideInput();
        if(!this.papyros.debugger.active && this.papyros.runner.state === RunState.Ready) {
            this.papyros.io.clearInputs();
        }
    }}
            ></p-batch-input-editor>
        `
    }
}