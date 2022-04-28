import { INPUT_TA_ID } from "../Constants";
import { InputMode } from "../InputManager";
import { UserInputHandler } from "./UserInputHandler";
import {
    RenderOptions, renderWithOptions
} from "../util/Rendering";

export class BatchInputHandler extends UserInputHandler {
    /**
     * The index of the next line in lines to send
     */
    private lineNr: number;
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
    }

    override onToggle(active: boolean): void {
        if (active) {
            this.inputArea.value = this.previousInput;
        } else {
            this.previousInput = this.inputArea.value;
        }
    }

    override getInputMode(): InputMode {
        return InputMode.Batch;
    }

    override getInitialInput(): string {
        return this.inputArea.value;
    }
    /**
     * Retrieve the lines of input that the user has given so far
     * @return {Array<string>} The entered lines
     */
    protected get lines(): Array<string> {
        const l = this.inputArea.value.split("\n");
        if (!l[l.length - 1]) { // last line is empty
            l.splice(l.length - 1); // do not consider it valid input
        }
        return l;
    }

    override hasNext(): boolean {
        return this.lineNr < this.lines.length;
    }

    override next(): string {
        const nextLine = this.lines[this.lineNr];
        this.lineNr += 1;
        return nextLine;
    }

    override onRunStart(): void {
        // First lines are provided at the start
        this.lineNr = this.lines.length;
    }

    override onRunEnd(): void {
        // Intentionally empty
    }

    protected override _render(options: RenderOptions): void {
        renderWithOptions(options, `
<textarea id="${INPUT_TA_ID}"
class="_tw-border-2 _tw-h-auto _tw-w-full _tw-max-h-1/4 _tw-px-1 _tw-overflow-auto _tw-rounded-lg
dark:_tw-border-dark-mode-content dark:_tw-bg-dark-mode-bg placeholder:_tw-text-placeholder-grey
focus:_tw-outline-none focus:_tw-ring-1 focus:_tw-ring-blue-500" rows="5">
</textarea>`);
        this.inputArea.addEventListener("keydown", (ev: KeyboardEvent) => {
            if (this.waiting && ev.key.toLowerCase() === "enter") {
                // If user replaced lines, use them
                if (this.lines.length < this.lineNr) {
                    this.lineNr = this.lines.length - 1;
                }
                this.inputCallback();
            }
        });
        this.inputArea.addEventListener("change", () => {
            this.previousInput = this.inputArea.value;
        });
        this.inputArea.value = this.previousInput;
    }
}
