import { proxy, Remote } from "comlink";
import { Backend } from "./Backend";
import { getBackend, stopBackend } from "./BackendManager";
import { CODE_TA_ID, DEFAULT_PROGRAMMING_LANGUAGE, INPUT_RELATIVE_URL,
    INPUT_TA_ID, LANGUAGE_SELECT_ID, OUTPUT_TA_ID,
    RUN_BTN_ID, TERMINATE_BTN_ID } from "./Constants";
import { PapyrosEvent } from "./PapyrosEvent";
import { LogType, papyrosLog } from "./util/Logging";

export function papyros(inputTextArray?: Uint8Array, inputMetaData?: Int32Array): void {
    let backend: Remote<Backend>;

    // textareas
    const codeArea = document.getElementById(CODE_TA_ID) as HTMLInputElement;
    let lineNr = 0;
    const inputArea = document.getElementById(INPUT_TA_ID) as HTMLInputElement;
    const outputArea = document.getElementById(OUTPUT_TA_ID) as HTMLInputElement;

    // selects
    const languageSelect = document.getElementById(LANGUAGE_SELECT_ID) as HTMLSelectElement;

    // buttons
    const runButton = document.getElementById(RUN_BTN_ID) as HTMLButtonElement;
    const terminateButton = document.getElementById(TERMINATE_BTN_ID) as HTMLButtonElement;

    // Input handling
    let awaitingInput = false;
    const encoder = new TextEncoder();


    function init(): void {
        const language = new URLSearchParams(window.location.search).get("language") ||
                             DEFAULT_PROGRAMMING_LANGUAGE;
        initBackend(language);
        initTextAreas();
        initButtons();
        initLanguageSelect();
    }

    async function initBackend(language?: string): Promise<void> {
        runButton.disabled = true;
        if (language) {
            languageSelect.value = language;
        }
        backend = getBackend(languageSelect.value);
        await backend.launch(proxy(e => onMessage(e)), inputTextArray, inputMetaData);
        runButton.disabled = false;
    }

    function initLanguageSelect(): void {
        languageSelect.addEventListener("change",
            () => {
                stopBackend(backend);
                return initBackend();
            }
        );
    }

    function initTextAreas(): void {
        inputArea.onkeydown = e => {
            papyrosLog(LogType.Debug, "Key down in inputArea", e);
            if (awaitingInput && e.key.toLowerCase() === "enter") {
                papyrosLog(LogType.Debug, "Pressed enter! Sending input to user");
                sendInput();
            }
        };
    }

    function onError(e: PapyrosEvent): void {
        papyrosLog(LogType.Debug, "Got error in Papyros: ", e);
        // todo prettify errors
        outputArea.value += e.data;
    }

    async function sendInput(): Promise<boolean> {
        papyrosLog(LogType.Debug, "Handling send Input in Papyros");
        const lines = inputArea.value.split("\n");
        if (lines.length > lineNr && lines[lineNr]) {
            papyrosLog(LogType.Debug, "Sending input to user: " + lines[lineNr]);
            const line = lines[lineNr];
            if (!inputMetaData || !inputTextArray) {
                await fetch(INPUT_RELATIVE_URL,
                    {
                        method: "POST",
                        body: JSON.stringify({ "input": line })
                    });
            } else {
                const encoded = encoder.encode(lines[lineNr]);
                inputTextArray.set(encoded);
                Atomics.store(inputMetaData, 1, encoded.length);
                Atomics.store(inputMetaData, 0, 1);
            }
            lineNr += 1;
            awaitingInput = false;
            return true;
        } else {
            papyrosLog(LogType.Debug, "Had no input to send, still waiting!");
            return false;
        }
    }

    async function onInput(e: PapyrosEvent): Promise<void> {
        papyrosLog(LogType.Debug, "Received onInput event in Papyros: ", e);
        if (!await sendInput()) {
            // todo render something based on the event
            awaitingInput = true;
            papyrosLog(LogType.Debug, "User needs to enter input before code can continue");
        }
    }

    function onMessage(e: PapyrosEvent): void {
        papyrosLog(LogType.Debug, "received event in onMessage", e);
        if (e.type === "output") {
            outputArea.value += e.data;
        } else if (e.type === "input") {
            onInput(e);
        } else if (e.type === "error") {
            onError(e);
        }
    }

    async function runCode(): Promise<void> {
        runButton.disabled = true;
        lineNr = 0;
        outputArea.value = "";
        terminateButton.hidden = false;
        papyrosLog(LogType.Debug, "Running code in Papyros, sending to backend");
        try {
            await backend.runCode(codeArea.value);
        } catch (error: any) {
            onError(error);
        } finally {
            terminateButton.hidden = true;
            runButton.disabled = false;
        }
    }

    function terminate(): Promise<void> {
        papyrosLog(LogType.Debug, "Called terminate, stopping backend!");
        terminateButton.hidden = true;
        stopBackend(backend);
        return initBackend();
    }

    function initButtons(): void {
        runButton.addEventListener("click", () => runCode());
        terminateButton.addEventListener("click", () => terminate());
    }

    init();
}
