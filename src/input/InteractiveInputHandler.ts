import { INPUT_TA_ID, SEND_INPUT_BTN_ID } from "../Constants";
import { InputMode } from "../InputManager";
import { addListener, getElement, RenderOptions, renderWithOptions, t } from "../util/Util";
import { UserInputHandler } from "./UserInputHandler";

/**
 * Input handler that takes input from the user in an interactive fashion
 */
export class InteractiveInputHandler extends UserInputHandler {
    /**
     * Retrieve the button that users can click to send their input
     */
    get sendButton(): HTMLButtonElement {
        return getElement<HTMLButtonElement>(SEND_INPUT_BTN_ID);
    }

    override getInputMode(): InputMode {
        return InputMode.Interactive;
    }

    override hasNext(): boolean {
        return this.waiting; // Allow sending empty lines when the user does this explicitly
    }

    override next(): string {
        const value = this.inputArea.value;
        this.reset();
        return value;
    }

    override waitWithPrompt(waiting: boolean, prompt?: string): void {
        super.waitWithPrompt(waiting, prompt);
        this.sendButton.disabled = !waiting;
        this.inputArea.disabled = !waiting;
        if (this.inputArea.disabled) {
            // Remove placeholder as it is disabled
            this.inputArea.setAttribute("placeholder", "");
            this.inputArea.setAttribute("title", t("Papyros.input_disabled"));
        }
    }

    override onToggle(): void {
        this.reset();
    }

    override onRunStart(): void {
        this.reset();
    }

    override onRunEnd(): void {
        // Intentionally empty
    }

    render(options: RenderOptions): HTMLElement {
        const rendered = renderWithOptions(options, `
<div class="flex flex-row">
    <input id="${INPUT_TA_ID}" type="text"
    class="border border-transparent w-full mr-0.5 px-1
    disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500">
    </input>
    <button id="${SEND_INPUT_BTN_ID}" type="button"
    class="text-black bg-white border-2 px-4
        disabled:opacity-50 disabled:cursor-wait">
        ${t("Papyros.enter")}
    </button>
</div>`);
        addListener(SEND_INPUT_BTN_ID, () => this.inputCallback(), "click");
        this.inputArea.addEventListener("keydown", (ev: KeyboardEvent) => {
            if (this.waiting && ev.key && ev.key.toLowerCase() === "enter") {
                this.inputCallback();
            }
        });
        return rendered;
    }
}
