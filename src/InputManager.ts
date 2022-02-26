import { t } from "i18n-js";
import {
    SWITCH_INPUT_MODE_A_ID,
    INPUT_AREA_WRAPPER_ID,
    INPUT_TA_ID, SEND_INPUT_BTN_ID
} from "./Constants";
import { PapyrosEvent } from "./PapyrosEvent";
import { papyrosLog, LogType } from "./util/Logging";
import { addListener, RenderOptions, renderWithOptions } from "./util/Util";
import { Channel, writeMessage } from "sync-message";

export enum InputMode {
    Interactive = "interactive",
    Batch = "batch"
}

export const INPUT_MODES = [InputMode.Batch, InputMode.Interactive];

interface InputSession {
    lineNr: number;
}

export class InputManager {
    renderOptions: RenderOptions;
    inputMode: InputMode;
    waiting: boolean;
    batchInput: string;
    onSend: () => void;
    session: InputSession;

    channel: Channel;
    messageId = "";

    constructor(onSend: () => void, inputMode: InputMode) {
        this.inputMode = inputMode;
        this.session = { lineNr: 0 };
        this.batchInput = "";
        this.channel = {} as Channel;
        this.onSend = onSend;
        this.waiting = false;
        this.renderOptions = { parentElementId: INPUT_AREA_WRAPPER_ID };
    }

    get enterButton(): HTMLButtonElement {
        return document.getElementById(SEND_INPUT_BTN_ID) as HTMLButtonElement;
    }

    get inputArea(): HTMLInputElement {
        return document.getElementById(INPUT_TA_ID) as HTMLInputElement;
    }

    render(options?: RenderOptions): void {
        if (options) {
            this.renderOptions = options;
        }
        const focusStyleClasses = "focus:outline-none focus:ring-1 focus:ring-blue-500";
        let inputArea = "";
        let otherMode: InputMode;
        if (this.inputMode === InputMode.Batch) {
            inputArea = `
            <textarea id="${INPUT_TA_ID}" 
            class="border-2 h-auto w-full max-h-1/4 px-1 overflow-auto ${focusStyleClasses}"
            rows="5"></textarea>`;
            otherMode = InputMode.Interactive;
        } else {
            inputArea = `
            <div class="flex flex-row">
                <input id="${INPUT_TA_ID}" type="text"
                class="border border-transparent w-full ${focusStyleClasses} mr-0.5 px-1
                disabled:cursor-not-allowed">
                </input>
                <button id="${SEND_INPUT_BTN_ID}" type="button"
                class="text-black bg-white border-2 px-4
                    disabled:opacity-50 disabled:cursor-wait">
                    ${t("Papyros.enter")}
                </button>
            </div>`;
            otherMode = InputMode.Batch;
        }
        const switchMode = `
            <a id="${SWITCH_INPUT_MODE_A_ID}" data-value="${otherMode}"
             class="flex flex-row-reverse hover:cursor-pointer text-blue-500">
                ${t(`Papyros.input_modes.switch_to_${otherMode}`)}
            </a>
        `;
        renderWithOptions(this.renderOptions, `
        ${inputArea}
        ${switchMode}
        `);
        addListener<InputMode>(SWITCH_INPUT_MODE_A_ID, im => this.setInputMode(im),
            "click", "data-value");
        if (this.inputMode === InputMode.Interactive) {
            addListener(SEND_INPUT_BTN_ID, () => this.sendLine(), "click");
        }
        this.inputArea.onkeydown = async e => {
            if (this.waiting &&
                e.key.toLowerCase() === "enter") {
                papyrosLog(LogType.Debug, "Pressed enter! Sending input to user");
                await this.onInput();
            }
        };
        this.setWaiting(this.waiting);
    }

    setInputMode(inputMode: InputMode): void {
        papyrosLog(LogType.Debug, `Switching input mode from ${this.inputMode} to ${inputMode}`);
        if (this.inputMode === InputMode.Batch) {
            // store for re-use later
            this.batchInput = this.inputArea.value;
        }
        this.inputMode = inputMode;
        this.render();
        if (this.inputMode === InputMode.Batch) {
            // Set previous batch
            this.inputArea.value = this.batchInput;
        }
    }

    setWaiting(waiting: boolean, prompt = ""): void {
        this.inputArea.setAttribute("placeholder",
            prompt || t(`Papyros.input_placeholder.${this.inputMode}`));
        this.inputArea.setAttribute("title", "");
        this.waiting = waiting;
        if (waiting) {
            if (this.inputMode === InputMode.Interactive) {
                this.enterButton.disabled = false;
            }
            this.inputArea.disabled = false;
            this.inputArea.focus();
        } else {
            if (this.inputMode === InputMode.Interactive) {
                this.inputArea.value = "";
                this.inputArea.disabled = true;
                // Remove placeholder as it is disabled
                this.inputArea.setAttribute("placeholder", "");
                this.inputArea.setAttribute("title", t("Papyros.input_disabled"));
                this.enterButton.disabled = true;
            }
        }
    }

    async sendLine(): Promise<boolean> {
        let line = "";
        if (this.inputMode === InputMode.Interactive) {
            line = this.inputArea.value;
        } else {
            const lines = this.inputArea.value.split("\n");
            if (lines.length > this.session.lineNr) {
                line = lines[this.session.lineNr];
            }
        }
        if (line) {
            papyrosLog(LogType.Debug, "Sending input to user: " + line);
            await writeMessage(this.channel, line, this.messageId);
            this.session.lineNr += 1;
            return true;
        } else {
            return false;
        }
    }

    async onInput(e?: PapyrosEvent): Promise<void> {
        papyrosLog(LogType.Debug, "Handling send Input in Papyros");
        if (e?.content) {
            this.messageId = e.content;
        }
        if (await this.sendLine()) {
            this.setWaiting(false);
            this.onSend();
        } else {
            papyrosLog(LogType.Debug, "Had no input to send, still waiting!");
            this.setWaiting(true, e?.data);
        }
    }

    onRunStart(): void {
        if (this.inputMode === InputMode.Interactive) {
            this.inputArea.value = "";
        }
        this.session.lineNr = 0;
    }

    onRunEnd(): void {
        // currently empty
    }
}
