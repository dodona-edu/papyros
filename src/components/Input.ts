import {customElement, property} from "lit/decorators.js";
import {html, LitElement, TemplateResult} from "lit";
import {StateController} from "@dodona/lit-state";
import {Papyros, papyros} from "../state/Papyros";
import {RunState} from "../state/Runner";
import "./code_mirror/BatchInputEditor";
import {t} from "../util/Util";

enum InputMode {
    batch = "batch",
    interactive = "interactive",
}

@customElement('p-input')
export class Input extends LitElement {
    controller = new StateController(this);
    @property()
    papyros: Papyros = papyros;

    @property({state: true})
    mode: InputMode = InputMode.batch;
    @property({state: true})
    buffer: string = '';

    get usedLines(): number {
        return this.papyros.io.inputs.length;
    }

    /**
     * All lines except the last one that has not (yet) been terminated by a newline
     */
    get lines(): string[] {
        return this.buffer.split('\n').slice(0,-1);
    }

    get nextLine(): string | undefined {
        if (this.lines.length > this.usedLines) {
            return this.lines[this.usedLines];
        }
        return undefined;
    }

    get placeholder(): string {
        if(this.papyros.io.prompt) {
            return this.papyros.io.prompt;
        }
        return t(`Papyros.input_placeholder.${this.mode}`)
    }

    constructor() {
        super();
        this.papyros.runner.subscribe(() => this.provideInput());
    }

    provideInput(): void {
        if(this.papyros.runner.state === RunState.AwaitingInput && this.nextLine !== undefined) {
            this.papyros.io.provideInput(this.nextLine);
        }
    }

    protected override render(): TemplateResult {
        return html`
            <p-batch-input-editor
                .value=${this.buffer}
                .usedLines=${this.usedLines}
                .readOnly=${this.papyros.debugger.active}
                .placeholder=${this.placeholder}
                @change=${(e: CustomEvent) => {
                    this.buffer = e.detail;
                    this.provideInput();
                }}
            ></p-batch-input-editor>
        `
    }
}