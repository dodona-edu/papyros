import { InputMode } from "../InputManager";
import { RenderOptions, renderWithOptions } from "../util/Util";
import { UserInputHandler } from "./UserInputHandler";

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
     * @param {function()} onInput  Callback for when the user has entered a value
     * @param {string} inputAreaId HTML identifier for the used HTML input field
     */
    constructor(onInput: () => void, inputAreaId: string) {
        super(onInput, inputAreaId);
        this.lineNr = 0;
        this.previousInput = "";
    }

    onToggle(active: boolean): void {
        if (active) {
            this.inputArea.value = this.previousInput;
        } else {
            this.previousInput = this.inputArea.value;
        }
    }

    getInputMode(): InputMode {
        return InputMode.Batch;
    }
    /**
     * Retrieve the lines of input that the user has given so far
     * @return {Array<string>} The entered lines
     */
    private get lines(): Array<string> {
        return this.inputArea.value.split("\n");
    }

    hasNext(): boolean {
        return this.lineNr < this.lines.length;
    }

    next(): string {
        const nextLine = this.lines[this.lineNr];
        this.lineNr += 1;
        return nextLine;
    }

    onRunStart(): void {
        this.lineNr = 0;
    }

    onRunEnd(): void {
        // Intentionally empty
    }

    render(options: RenderOptions): HTMLElement {
        const rendered = renderWithOptions(options, `
<textarea id="${this.inputAreaId}" 
class="border-2 h-auto w-full max-h-1/4 px-1 overflow-auto
rows="5" focus:outline-none focus:ring-1 focus:ring-blue-500>
</textarea>`);
        this.inputArea.addEventListener("keydown", (ev: KeyboardEvent) => {
            if (this.waiting && ev.key.toLowerCase() === "enter") {
                console.log("Enter down, current data: ",
                    this.lineNr, this.lines, this.lines.length);
                if (this.lines.length <= this.lineNr) {
                    this.lineNr = this.lines.length - 1;
                }
                this.onInput();
            }
        });
        return rendered;
    }
}
