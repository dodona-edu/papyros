import {
    SWITCH_INPUT_MODE_A_ID,
    USER_INPUT_WRAPPER_ID
} from "./Constants";
import { BackendEvent, BackendEventType } from "./BackendEvent";
import {
    addListener, getElement, t
} from "./util/Util";
import { InteractiveInputHandler } from "./input/InteractiveInputHandler";
import { UserInputHandler } from "./input/UserInputHandler";
import { BatchInputHandler } from "./input/BatchInputHandler";
import { BackendManager } from "./BackendManager";
import { Renderable, RenderOptions, renderWithOptions } from "./util/Rendering";
import { EditorStyling } from "./editor/CodeMirrorEditor";

export enum InputMode {
    Interactive = "interactive",
    Batch = "batch"
}

export const INPUT_MODES = [InputMode.Batch, InputMode.Interactive];

export interface InputManagerRenderOptions extends RenderOptions {
    /**
     * Option to allow styling the editor area of the input handler
     */
    inputStyling?: Partial<EditorStyling>;
}

export class InputManager extends Renderable<InputManagerRenderOptions> {
    private inputMode: InputMode;
    private inputHandlers: Map<InputMode, UserInputHandler>;
    private waiting: boolean;
    private prompt: string;

    private sendInput: (input: string) => void;

    constructor(sendInput: (input: string) => void, inputMode: InputMode) {
        super();
        this.onUserInput = this.onUserInput.bind(this);
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
            new InteractiveInputHandler(this.onUserInput);
        const batchInputHandler: UserInputHandler =
            new BatchInputHandler(this.onUserInput);
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

    public getInputHandler(inputMode: InputMode): UserInputHandler {
        return this.inputHandlers.get(inputMode)!;
    }

    public get inputHandler(): UserInputHandler {
        return this.getInputHandler(this.inputMode)!;
    }

    public isWaiting(): boolean {
        return this.waiting;
    }

    protected override _render(options: InputManagerRenderOptions): void {
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
            darkMode: options.darkMode,
            inputStyling: options.inputStyling
        });
        this.inputHandler.waitWithPrompt(this.waiting, this.prompt);
    }

    private waitWithPrompt(waiting: boolean, prompt = ""): void {
        this.waiting = waiting;
        this.prompt = prompt;
        this.inputHandler.waitWithPrompt(this.waiting, this.prompt);
    }

    private onUserInput(line: string): void {
        this.sendInput(line);
        this.waitWithPrompt(false);
    }

    /**
     * Asynchronously handle an input request by prompting the user for input
     * @param {BackendEvent} e Event containing the input data
     */
    private onInputRequest(e: BackendEvent): void {
        this.waitWithPrompt(true, e.data);
    }

    private onRunStart(): void {
        // Prevent switching input mode during runs
        getElement(SWITCH_INPUT_MODE_A_ID).hidden = true;
        this.waitWithPrompt(false);
        this.inputHandler.onRunStart();
    }

    private onRunEnd(): void {
        getElement(SWITCH_INPUT_MODE_A_ID).hidden = false;
        this.inputHandler.onRunEnd();
        this.waitWithPrompt(false);
    }
}
