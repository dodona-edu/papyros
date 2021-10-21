import { Backend } from "./Backend";
import { getBackend } from "./BackendManager";
import { CODE_TA_ID, INPUT_TA_ID, LANGUAGE_SELECT_ID, OUTPUT_TA_ID, RUN_BTN_ID, TERMINATE_BTN_ID } from "./Constants";

export async function Papyros(){
    let backend: Backend;

    // textareas
    const codeArea = document.getElementById(CODE_TA_ID) as HTMLInputElement;
    let lineNr = 0;
    const inputArea = document.getElementById(INPUT_TA_ID) as HTMLInputElement;
    const outputArea = document.getElementById(OUTPUT_TA_ID) as HTMLInputElement;

    const languageSelect = document.getElementById(LANGUAGE_SELECT_ID) as HTMLSelectElement;

    const terminateButton = document.getElementById(TERMINATE_BTN_ID) as HTMLButtonElement;
    function init(){
        const language = new URLSearchParams(window.location.search).get("language") || "python";
        initBackend(language).then(b => backend = b);
        initTextAreas();
        initButtons();
        initLanguageSelect();
    }

    async function initBackend(language?: string): Promise<Backend> {
        if(language){
            languageSelect.value = language;
        }
        backend = getBackend(languageSelect.value);
        return backend.launch().catch(() => backend);
    }

    async function initLanguageSelect(){
        languageSelect.addEventListener("change", async () => {
            await backend.shutdown();
            initBackend();
        });
    }

    function initTextAreas(){

    }

    function onMessage(e: any){
        if(e.type === "print"){
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

        }
    }

    async function runCode(){
        lineNr = 0;
        outputArea.value = "";
        try {
            terminateButton.hidden = false;
            await backend.runCode(codeArea.value, inputArea.value, onMessage);
        } catch(e: any){
            outputArea.value += e.toString();
        } finally {
            terminateButton.hidden = true;
        }
    }

    async function terminate(){
        await backend.terminateExecution();
        terminateButton.hidden = true;
    }

    function initButtons(){
        document.getElementById(RUN_BTN_ID)?.addEventListener("click", () => runCode());
        terminateButton?.addEventListener("click", () => terminate());
    }

    init();
}