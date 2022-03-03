import { InputMode } from "../InputManager";
import { getElement, RenderOptions, renderWithOptions, t } from "../util/Util";
import { UserInputHandler } from "./UserInputHandler";

export class InteractiveInputHandler extends UserInputHandler {
    /**
     * HTML identifier for the used HTML button
     */
    private sendButtonId: string;
    /**
     * Construct a new InteractiveInputHandler
     * @param {function()} onInput  Callback for when the user has entered a value
     * @param {string} inputAreaId HTML identifier for the used HTML input field
     * @param {string} sendButtonId HTML identifier for the used HTML button
     */
    constructor(onInput: () => void, inputAreaId: string,
        sendButtonId: string) {
        super(onInput, inputAreaId);
        this.sendButtonId = sendButtonId;
    }

    /**
     * Retrieve the button that users can click to send their input
     */
    get sendButton(): HTMLButtonElement {
        return getElement<HTMLButtonElement>(this.sendButtonId);
    }

    getInputMode(): InputMode {
        return InputMode.Interactive;
    }

    hasNext(): boolean {
        return this.waiting; // Allow sending empty lines when the user does this explicitly
    }

    next(): string {
        const value = this.inputArea.value;
        this.inputArea.value = "";
        return value;
    }

    setWaiting(waiting: boolean, prompt?: string): void {
        super.setWaiting(waiting, prompt);
        this.sendButton.disabled = !waiting;
        this.inputArea.disabled = !waiting;
        if (this.inputArea.disabled) {
            // Remove placeholder as it is disabled
            this.inputArea.setAttribute("placeholder", "");
            this.inputArea.setAttribute("title", t("Papyros.input_disabled"));
        }
    }

    onToggle(): void {
        this.reset();
    }

    onRunStart(): void {
        this.reset();
    }

    onRunEnd(): void {
        // Intentionally empty
    }

    render(options: RenderOptions): HTMLElement {
        const rendered = renderWithOptions(options, `
<div class="flex flex-row">
    <input id="${this.inputAreaId}" type="text"
    class="border border-transparent w-full mr-0.5 px-1
    disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500">
    </input>
    <button id="${this.sendButtonId}" type="button"
    class="text-black bg-white border-2 px-4
        disabled:opacity-50 disabled:cursor-wait">
        ${t("Papyros.enter")}
    </button>
</div>`);
        getElement<HTMLButtonElement>(this.sendButtonId)
            .addEventListener("click", () => this.onInput());
        this.inputArea.addEventListener("keydown", (ev: KeyboardEvent) => {
            if (this.waiting && ev.key.toLowerCase() === "enter") {
                this.onInput();
            }
        });
        return rendered;
    }
}
