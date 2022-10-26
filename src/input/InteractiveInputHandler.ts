import { INPUT_TA_ID, SEND_INPUT_BTN_ID } from "../Constants";
import { InputMode } from "../InputManager";
import { addListener, getElement, i18n } from "../util/Util";
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
    private get sendButton(): HTMLButtonElement {
        return getElement<HTMLButtonElement>(SEND_INPUT_BTN_ID);
    }

    /**
     * Retrieve the HTMLInputElement for this InputHandler
     */
    private get inputArea(): HTMLInputElement {
        return getElement<HTMLInputElement>(INPUT_TA_ID);
    }

    public override getInputMode(): InputMode {
        return InputMode.Interactive;
    }

    public override hasNext(): boolean {
        return this.waiting; // Allow sending empty lines when the user does this explicitly
    }

    public override next(): string {
        const value = this.inputArea.value;
        this.reset();
        return value;
    }

    public override waitWithPrompt(waiting: boolean, prompt?: string): void {
        this.waiting = waiting;
        this.sendButton.disabled = !waiting;
        this.inputArea.disabled = !waiting;
        super.waitWithPrompt(waiting, prompt);
    }

    protected override setPlaceholder(placeholder: string): void {
        if (this.waiting) {
            this.inputArea.setAttribute("placeholder", placeholder);
            this.inputArea.setAttribute("title", "");
        } else {
            this.inputArea.setAttribute("placeholder", "");
            this.inputArea.setAttribute("title", i18n.t("Papyros.input_disabled"));
        }
    }

    public focus(): void {
        this.inputArea.focus();
    }

    public override toggle(): void {
        this.reset();
    }

    public override onRunStart(): void {
        this.reset();
    }

    public override onRunEnd(): void {
        // Intentionally empty
    }

    protected override _render(options: RenderOptions): void {
        const buttonHTML = renderButton({
            id: SEND_INPUT_BTN_ID,
            // eslint-disable-next-line max-len
            classNames: "_tw-text-black _tw-bg-white _tw-border-2 dark:_tw-text-white dark:_tw-bg-dark-mode-bg",
            buttonText: i18n.t("Papyros.enter")
        });
        renderWithOptions(options, `
<div class="_tw-flex _tw-flex-row _tw-my-1">
    <input id="${INPUT_TA_ID}" type="text"
    class="_tw-border _tw-w-full _tw-mr-0.5 _tw-px-1 _tw-rounded-lg
    dark:_tw-border-dark-mode-content dark:_tw-bg-dark-mode-bg
    placeholder:_tw-text-placeholder-grey disabled:_tw-cursor-not-allowed
    focus:_tw-outline-none focus:_tw-ring-1 focus:_tw-ring-blue-500">
    </input>
    ${buttonHTML}
</div>`);
        addListener(SEND_INPUT_BTN_ID, () => this.inputCallback(this.next()), "click");
        this.inputArea.addEventListener("keydown", (ev: KeyboardEvent) => {
            if (this.waiting && ev.key && ev.key.toLowerCase() === "enter") {
                this.inputCallback(this.next());
            }
        });
    }

    protected reset(): void {
        super.reset();
        this.inputArea.value = "";
    }
}
