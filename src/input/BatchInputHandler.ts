import { INPUT_TA_ID } from "../Constants";
import { InputMode } from "../InputManager";
import { UserInputHandler } from "./UserInputHandler";
import { RenderOptions, renderWithOptions } from "../util/Rendering";

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
        this.lineNr = 0;
    }

    override onRunEnd(): void {
        // Intentionally empty
    }

    protected override _render(options: RenderOptions): void {
        renderWithOptions(options, `
<textarea id="${INPUT_TA_ID}"
class="border-2 h-auto w-full max-h-1/4 px-1 overflow-auto
focus:outline-none focus:ring-1 focus:ring-blue-500" rows="5">
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
    }
}
