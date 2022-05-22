import { t } from "i18n-js";
import {
    SWITCH_INPUT_MODE_A_ID,
    USER_INPUT_WRAPPER_ID
} from "./Constants";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import {
    addListener,
} from "./util/Util";
import { InteractiveInputHandler } from "./input/InteractiveInputHandler";
import { UserInputHandler } from "./input/UserInputHandler";
import { BatchInputHandler } from "./input/BatchInputHandler";
import { BackendManager } from "./BackendManager";
import { Renderable, RenderOptions, renderWithOptions } from "./util/Rendering";

export enum InputMode {
    Interactive = "interactive",
    Batch = "batch"
}

export const INPUT_MODES = [InputMode.Batch, InputMode.Interactive];

export class InputManager extends Renderable {
    private inputMode: InputMode;
    private inputHandlers: Map<InputMode, UserInputHandler>;
    private waiting: boolean;
    private prompt: string;

    private sendInput: (input: string) => void;

    constructor(sendInput: (input: string) => void, inputMode: InputMode) {
        super();
        this.inputHandlers = this.buildInputHandlerMap();
        this.inputMode = inputMode;
        this.sendInput = sendInput;
        this.waiting = false;
        this.prompt = "";
        BackendManager.subscribe(BackendEventType.Start, () => this.onRunStart());
        BackendManager.subscribe(BackendEventType.End, () => this.onRunEnd());
        BackendManager.subscribe(BackendEventType.Input, e => this.onInputRequest(e));
    }

    private buildInputHandlerMap(): Map<InputMode, UserInputHandler> {
        const interactiveInputHandler: UserInputHandler =
            new InteractiveInputHandler(() => this.onUserInput());
        const batchInputHandler: UserInputHandler =
            new BatchInputHandler(() => this.onUserInput());
        return new Map([
            [InputMode.Interactive, interactiveInputHandler],
            [InputMode.Batch, batchInputHandler]
        ]);
    }

    public getInputMode(): InputMode {
        return this.inputMode;
    }

    public setInputMode(inputMode: InputMode): void {
        this.inputHandler.toggle(false);
        this.inputMode = inputMode;
        this.render();
        this.inputHandler.toggle(true);
    }

    private get inputHandler(): UserInputHandler {
        return this.inputHandlers.get(this.inputMode)!;
    }

    public isWaiting(): boolean {
        return this.waiting;
    }

    protected override _render(options: RenderOptions): void {
        let switchMode = "";
        const otherMode = this.inputMode === InputMode.Interactive ?
            InputMode.Batch : InputMode.Interactive;
        switchMode = `<a id="${SWITCH_INPUT_MODE_A_ID}" data-value="${otherMode}"
        class="_tw-flex _tw-flex-row-reverse hover:_tw-cursor-pointer _tw-text-blue-500">
            ${t(`Papyros.switch_input_mode_to.${otherMode}`)}
        </a>`;

        renderWithOptions(options, `
<div id="${USER_INPUT_WRAPPER_ID}" class="_tw-my-1">
</div>
${switchMode}`);
        addListener<InputMode>(SWITCH_INPUT_MODE_A_ID, im => this.setInputMode(im),
            "click", "data-value");

        this.inputHandler.render({
            parentElementId: USER_INPUT_WRAPPER_ID,
            darkMode: options.darkMode
        });
        this.inputHandler.waitWithPrompt(this.waiting, this.prompt);
    }

    private waitWithPrompt(waiting: boolean, prompt = ""): void {
        this.waiting = waiting;
        this.prompt = prompt;
        this.inputHandler.waitWithPrompt(this.waiting, this.prompt);
    }

    private async onUserInput(): Promise<void> {
        if (this.inputHandler.hasNext()) {
            const line = this.inputHandler.next();
            this.sendInput(line);
            this.waitWithPrompt(false);
        } else {
            this.waitWithPrompt(true, this.prompt);
        }
    }

    /**
     * Asynchronously handle an input request by prompting the user for input
     * @param {BackendEvent} e Event containing the input data
     * @return {Promise<void>} Promise of handling the request
     */
    private async onInputRequest(e: BackendEvent): Promise<void> {
        this.prompt = e.data;
        return await this.onUserInput();
    }

    private onRunStart(): void {
        this.waitWithPrompt(false);
        this.inputHandler.onRunStart();
    }

    private onRunEnd(): void {
        this.inputHandler.onRunEnd();
        this.waitWithPrompt(false);
    }
}
