import { proxy, Remote } from "comlink";
import { Backend} from "./Backend";
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

    // Input handling
    let awaitingInput = false;
    const encoder = new TextEncoder();

    // shared memory
    let inputTextArray: Uint8Array | undefined = undefined;
        // 2 Int32s: index 0 indicates whether data is written, index 1 denotes length of the string
    let inputMetaData: Int32Array | undefined = undefined;
    const fetchInputUrl = `${document.location.pathname}input`
    if(typeof SharedArrayBuffer !== "undefined"){
        //inputTextArray = new Uint8Array(new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * 1024));
        //inputMetaData = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2));
        //let interruptBuffer = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
        navigator.serviceWorker.register("./inputServiceWorker.js", { scope: "" });
    } else if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./inputServiceWorker.js", { scope: "" });
    } else {
        console.log(typeof SharedArrayBuffer);
        console.log(navigator);
        console.log(navigator.serviceWorker);
        console.log("Your browser is unsupported. Please use a modern version of Chrome, Safari, Firefox, ...");
        //document.getElementById("papyros")!.innerHTML = "Your browser is unsupported. Please use a modern version of Chrome, Safari, Firefox, ...";
    }


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
                console.log("Pressed enter! Sending input to user");
                sendInput();
            }
        }
    }

    function onError(e: PapyrosEvent): void {
        console.log("Got error in Papyros: ", e);
        // todo prettify errors
        outputArea.value += e.data;
    }

    async function sendInput(){
        console.log("Handling send Input in Papyros");
        const lines = inputArea.value.split("\n");
        if(lines.length > lineNr && lines[lineNr]){
            console.log("Sending input to user: " + lines[lineNr]);
            const line = lines[lineNr];
            if(!inputMetaData || !inputTextArray){
               await fetch(fetchInputUrl, {method: "POST", body: JSON.stringify({"input": line})});
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
            console.log("Had no input to send, still waiting!");
            return false;
        }
    }

    async function onInput(e: PapyrosEvent): Promise<void> {
        console.log("Received onInput event in Papyros: ", e);
        if(!await sendInput()){
            // todo render something based on the event
            awaitingInput = true;
            console.log("User needs to enter input before code can continue");
        }
    }

    function onMessage(e: PapyrosEvent): void {
        console.log("received event in onMessage", e);
        if(e.type === "output"){
            outputArea.value += e.data;
        } else if(e.type === "input"){
            onInput(e);
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
        /*runButton.addEventListener("click", () => {
            //sendInput();
            fetch("/input").then(r => console.log("Got result from GET /input", r));
        });*/
        runButton.addEventListener("click", () => runCode());
        terminateButton.addEventListener("click", () => terminate());
    }

    init();
}