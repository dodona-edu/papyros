import { proxy, Remote } from "comlink";
import { Backend } from "./Backend";
import { getBackend, stopBackend } from "./BackendManager";
import { CODE_TA_ID, DEFAULT_PROGRAMMING_LANGUAGE, INPUT_TA_ID, LANGUAGE_SELECT_ID, OUTPUT_TA_ID, RUN_BTN_ID, TERMINATE_BTN_ID } from "./Constants";
import { PapyrosEvent } from "./PapyrosEvent";

export function Papyros(){
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

    // shared memory
    console.assert(typeof SharedArrayBuffer !== "undefined");
    let inputTextArray = new Uint8Array(new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * 1024));
    // 2 Int32s: index 0 indicates whether data is written, index 1 denotes length of the string
    let inputMetaData = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2));
    //let interruptBuffer = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
    let awaitingInput = false;
    const encoder = new TextEncoder();


    function init(): void {
        const language = new URLSearchParams(window.location.search).get("language") || DEFAULT_PROGRAMMING_LANGUAGE;
        initBackend(language);
        initTextAreas();
        initButtons();
        initLanguageSelect();
    }

    function initBackend(language?: string): Promise<void> {
        runButton.disabled = true;
        if(language){
            languageSelect.value = language;
        }
        backend = getBackend(languageSelect.value);
        console.log("Got backend: ", backend);
        return backend.launch(proxy(e => onMessage(e)), inputTextArray, inputMetaData)
                .then(() => {runButton.disabled = false});
    }

    function initLanguageSelect(): void {
        languageSelect.addEventListener("change",
         () =>  stopBackend(backend).finally(() => initBackend())
        );
    }

    function initTextAreas(): void {
        inputArea.onkeydown = (e) => {
            console.log("Key down in inputArea", e);
            if(awaitingInput && e.key.toLowerCase() === "enter"){
                sendInput();
            }
        }
    }

    function onError(e: PapyrosEvent): void {
        console.log("Got error in Papyros: ", e);
        // todo prettify errors
        outputArea.value += e.data;
    }

    function sendInput(){
        const lines = inputArea.value.split("\n");
        if(lines.length > lineNr && lines[lineNr]){
            console.log("Sending input to user: " + lines[lineNr]);
            const encoded = encoder.encode(lines[lineNr]);
            inputTextArray.set(encoded);
            Atomics.store(inputMetaData, 1, encoded.length);
            Atomics.store(inputMetaData, 0, 1);
            //backend.send({"type": "input", "data": lines[lineNr]});
            lineNr += 1;
            awaitingInput = false;
            return true;
        } else {
            return false;
        }
    }

    function onMessage(e: PapyrosEvent): void {
        console.log("received event in onMessage", e);
        if(e.type === "output"){
            outputArea.value += e.data;
        } else if(e.type === "input"){
            console.log("Asked input in main thread for: ", e.data);
            if(!sendInput()){
                console.log("User needs to enter something before python can continue!");
                awaitingInput = true;
            }
        } else if(e.type === "error"){
            onError(e);
        }
    }

    function runCode(): Promise<void> {
        runButton.disabled = true;
        lineNr = 0;
        outputArea.value = "";
        terminateButton.hidden = false;
        console.log("Running code in Papyros, sending to backend");
        return backend.runCode(codeArea.value)
            .catch(onError)
            .finally(() => {
                terminateButton.hidden = true;
                runButton.disabled = false;
            });
    }

    function terminate(): Promise<void> {
        console.log("Called terminate, stopping backend!");
        terminateButton.hidden = true;
        return stopBackend(backend).then(() => initBackend());
    }

    function initButtons(): void {
        runButton.addEventListener("click", () => runCode());
        terminateButton.addEventListener("click", () => terminate());
    }

    init();
}