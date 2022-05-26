import { InputMode } from "../InputManager";
import { UserInputHandler } from "./UserInputHandler";
import {
    RenderOptions,
} from "../util/Rendering";
import { t } from "../util/Util";
import { BatchInputEditor } from "../editor/BatchInputEditor";

export class BatchInputHandler extends UserInputHandler {
    /**
     * The index of the next line in lines to send
     */
    private lineNr: number;
    /**
     * Messages used when asking for user input
     */
    private prompts: Array<string>;
    /**
     * Editor containing the input of the user
     */
    private batchEditor: BatchInputEditor;
    /**
     * The previous input of the user
     * Is restored upon switching back to InputMode.Batch
     */
    private previousInput: string;

    /**
     * Construct a new BatchInputHandler
     * @param {function()} inputCallback  Callback for when the user has entered a value
     */
    constructor(inputCallback: () => void) {
        super(inputCallback);
        this.lineNr = 0;
        this.previousInput = "";
        this.prompts = [];
        this.batchEditor = new BatchInputEditor();
        this.batchEditor.onChange({
            onChange: this.handleInputChanged.bind(this),
            delay: 0
        });
    }

    /**
     * Handle new input, potentially sending it to the awaiting receiver
     * @param {string} newInput The new user input
     */
    private handleInputChanged(newInput: string): void {
        if (!newInput) {
            this.highlight(() => false);
        } else {
            const newLines = newInput.split("\n");
            if (this.waiting && newLines.length > this.lineNr + 1) {
                // Require explicitly pressing enter
                this.inputCallback();
            }
            this.highlight();
        }

        this.previousInput = newInput;
    }

    public override toggle(active: boolean): void {
        if (active) {
            this.batchEditor.setText(this.previousInput);
        } else {
            this.previousInput = this.batchEditor.getText();
        }
    }

    public override getInputMode(): InputMode {
        return InputMode.Batch;
    }

    /**
     * Retrieve the lines of input that the user has given so far
     * @return {Array<string>} The entered lines
     */
    protected get lines(): Array<string> {
        return this.batchEditor.getLines();
    }

    public override hasNext(): boolean {
        return this.lineNr < this.lines.length;
    }

    private highlight(whichLines = (i: number) => i < this.lineNr): void {
        this.batchEditor.highlight((lineNr: number) => {
            let message = t("Papyros.used_input");
            const index = lineNr - 1;
            const shouldShow = whichLines(index);
            if (index < this.prompts.length && this.prompts[index]) {
                message = t("Papyros.used_input_with_prompt",
                    { prompt: this.prompts[index] });
            }
            return { lineNr, on: shouldShow, title: message };
        });
    }

    public override next(): string {
        const nextLine = this.lines[this.lineNr];
        this.lineNr += 1;
        this.highlight();
        return nextLine;
    }

    public override onRunStart(): void {
        this.lineNr = 0;
        this.highlight(() => false);
    }

    public override onRunEnd(): void {
        // Intentionally empty
    }

    public override waitWithPrompt(waiting: boolean, prompt?: string): void {
        if (waiting) {
            this.prompts.push(prompt || "");
        }
        super.waitWithPrompt(waiting, prompt);
    }

    protected setPlaceholder(placeholderValue: string): void {
        this.batchEditor.setPlaceholder(placeholderValue);
    }

    public focus(): void {
        this.batchEditor.focus();
    }

    protected override _render(options: RenderOptions): void {
        this.batchEditor.render(options);
        this.highlight();
    }
}
