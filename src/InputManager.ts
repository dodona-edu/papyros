import { t } from "i18n-js";
import {
    SWITCH_INPUT_MODE_A_ID,
    INPUT_AREA_WRAPPER_ID,
    INPUT_RELATIVE_URL, INPUT_TA_ID, SEND_INPUT_BTN_ID
} from "./Constants";
import { PapyrosEvent } from "./PapyrosEvent";
import { papyrosLog, LogType } from "./util/Logging";
import { addListener } from "./util/Util";


export enum InputMode {
    Interactive = "interactive",
    Batch = "batch"
}

export const INPUT_MODES = [InputMode.Batch, InputMode.Interactive];

interface InputSession {
    lineNr: number;
}

export class InputManager {
    inputWrapper: HTMLElement;
    inputMode: InputMode;
    waiting: boolean;
    batchInput: string;
    onSend: () => void;
    session: InputSession;

    inputTextArray?: Uint8Array;
    inputMetaData?: Int32Array;
    textEncoder: TextEncoder;

    constructor(onSend: () => void, inputMode: InputMode) {
        this.inputWrapper = document.getElementById(INPUT_AREA_WRAPPER_ID) as HTMLElement;
        this.inputMode = inputMode;
        this.session = { lineNr: 0 };
        this.batchInput = "";
        this.textEncoder = new TextEncoder();
        if (typeof SharedArrayBuffer !== "undefined") {
            papyrosLog(LogType.Important, "Using SharedArrayBuffers");
            // shared memory
            this.inputTextArray = new Uint8Array(
                new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * 1024));
            // 2 Int32s:
            // index 0 indicates whether data is written
            // index 1 denotes length of the string
            this.inputMetaData = new Int32Array(
                new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2));
        } else {
            papyrosLog(LogType.Important, "Using serviceWorker for input");
        }
        this.onSend = onSend;
        this.waiting = false; // prevent TS error from no initializer
        this.setInputMode(this.inputMode);
    }

    get enterButton(): HTMLButtonElement {
        return document.getElementById(SEND_INPUT_BTN_ID) as HTMLButtonElement;
    }

    get inputArea(): HTMLInputElement {
        return document.getElementById(INPUT_TA_ID) as HTMLInputElement;
    }

    buildInputArea(): void {
        const focusStyleClasses = " focus:outline-none focus:ring-1 focus:ring-blue-500";
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
        this.inputWrapper.innerHTML = `
        ${inputArea}
        ${switchMode}
        `;
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
    }

    setInputMode(inputMode: InputMode): void {
        papyrosLog(LogType.Debug, `Switching input mode from ${this.inputMode} to ${inputMode}`);
        if (this.inputMode === InputMode.Batch) {
            // store for re-use later
            this.batchInput = this.inputArea.value;
        }
        this.inputMode = inputMode;
        this.buildInputArea();
        this.setWaiting(this.waiting);
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
            if(this.inputMode === InputMode.Interactive){
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
            if (!this.inputMetaData || !this.inputTextArray) {
                await fetch(INPUT_RELATIVE_URL,
                    {
                        method: "POST",
                        body: JSON.stringify({ "input": line })
                    });
            } else {
                const encoded = this.textEncoder.encode(line);
                this.inputTextArray.set(encoded);
                Atomics.store(this.inputMetaData, 1, encoded.length);
                Atomics.store(this.inputMetaData, 0, 1);
            }
            this.session.lineNr += 1;
            return true;
        } else {
            return false;
        }
    }

    async onInput(e?: PapyrosEvent): Promise<void> {
        papyrosLog(LogType.Debug, "Handling send Input in Papyros");
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
