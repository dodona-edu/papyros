import { proxy, releaseProxy, Remote } from "comlink";
import { Backend } from "./Backend";
import { getBackend } from "./BackendManager";
import { CODE_TA_ID, DEFAULT_PROGRAMMING_LANGUAGE, INPUT_TA_ID, LANGUAGE_SELECT_ID, OUTPUT_TA_ID, RUN_BTN_ID, TERMINATE_BTN_ID } from "./Constants";
import { PapyrosEvent } from "./PapyrosEvent";

export function Papyros(){
    let backend: Remote<Backend>;

    // textareas
    const codeArea = document.getElementById(CODE_TA_ID) as HTMLInputElement;
    let lineNr = 0;
    const inputArea = document.getElementById(INPUT_TA_ID) as HTMLInputElement;
    const outputArea = document.getElementById(OUTPUT_TA_ID) as HTMLInputElement;

    const languageSelect = document.getElementById(LANGUAGE_SELECT_ID) as HTMLSelectElement;

    const runButton = document.getElementById(RUN_BTN_ID) as HTMLButtonElement;
    const terminateButton = document.getElementById(TERMINATE_BTN_ID) as HTMLButtonElement;

    function init(): void {
        const language = new URLSearchParams(window.location.search).get("language") || DEFAULT_PROGRAMMING_LANGUAGE;
        initBackend(language);
        initTextAreas();
        initButtons();
        initLanguageSelect();
    }

    function initBackend(language?: string): Promise<void> {
        if(language){
            languageSelect.value = language;
        }
        backend = getBackend(languageSelect.value);
        console.log("Got backend: ", backend);
        return backend.launch(proxy(e => onMessage(e)));
    }

    function initLanguageSelect(): void {
        languageSelect.addEventListener("change",
         () =>  backend.shutdown().finally(() => initBackend())
        );
    }

    function initTextAreas(): void {

    }

    function onError(e: PapyrosEvent): void {
        console.log("Got error in Papyros: ", e);
        // todo prettify errors
        outputArea.value += e.data;
    }

    function onMessage(e: PapyrosEvent): void {
        console.log("received event in onMessage", e);
        if(e.type === "output"){
            outputArea.value += e.data;
        } else if(e.type === "input"){
            console.log("Asked input in main thread for: ", e.data);
            const lines = inputArea.value.split("\n");
            if(lines.length > lineNr && lines[lineNr]){
                backend.send({"type": "input", "data": lines[lineNr]});
                lineNr += 1;
            } else {
                //alert("Not enough input supplied!");
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
                terminateButton.hidden = false;
                runButton.disabled = false;
            });
    }

    function terminate(): Promise<void> {
        backend.terminateExecution();
        backend[releaseProxy]();
        terminateButton.hidden = true;
        return initBackend();
    }

    function initButtons(): void {
        runButton.addEventListener("click", () => runCode());
        terminateButton.addEventListener("click", () => terminate());
    }

    init();
}