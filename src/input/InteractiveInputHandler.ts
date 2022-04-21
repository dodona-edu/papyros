import { INPUT_TA_ID, SEND_INPUT_BTN_ID } from "../Constants";
import { InputMode } from "../InputManager";
import { addListener, getElement, t } from "../util/Util";
import { UserInputHandler } from "./UserInputHandler";
import {
    renderButton,
    RenderOptions, renderWithOptions
} from "../util/Rendering";

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

    protected override _render(options: RenderOptions): void {
        const buttonHTML = renderButton({
            id: SEND_INPUT_BTN_ID,
            // eslint-disable-next-line max-len
            classNames: "text-black bg-white border-2 dark:text-white dark:bg-dark-mode-bg",
            buttonText: t("Papyros.enter")
        });
        renderWithOptions(options, `
<div class="flex flex-row my-1">
    <input id="${INPUT_TA_ID}" type="text"
    class="border border-transparent w-full mr-0.5 px-1 rounded-lg
    dark:border-dark-mode-content dark:bg-dark-mode-bg placeholder:text-placeholder-grey
    disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500">
    </input>
    ${buttonHTML}
</div>`);
        addListener(SEND_INPUT_BTN_ID, () => this.inputCallback(), "click");
        this.inputArea.addEventListener("keydown", (ev: KeyboardEvent) => {
            if (this.waiting && ev.key && ev.key.toLowerCase() === "enter") {
                this.inputCallback();
            }
        });
    }
}
