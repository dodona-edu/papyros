import { Backend } from "./Backend";
import { getBackend } from "./BackendManager";
import { CODE_TA_ID, INPUT_TA_ID, LANGUAGE_SELECT_ID, OUTPUT_TA_ID, RUN_BTN_ID } from "./Constants";

export async function Papyros(){
    let backend: Backend;

    // textareas
    const codeArea = document.getElementById(CODE_TA_ID) as HTMLInputElement;
    const inputArea = document.getElementById(INPUT_TA_ID) as HTMLInputElement;
    const outputArea = document.getElementById(OUTPUT_TA_ID) as HTMLInputElement;

    const languageSelect = document.getElementById(LANGUAGE_SELECT_ID) as HTMLSelectElement;
    async function init(){
        const language = new URLSearchParams(window.location.search).get("language") || "python";
        backend = await initBackend(language);
        initTextAreas();
        initButtons();
        initLanguageSelect();
    }

    async function initBackend(language?: string): Promise<Backend> {
        console.log("got language: ", language);
        if(language){
            languageSelect.value = language;
        }
        console.log(languageSelect.value);
        backend = getBackend(languageSelect.value);
        return backend.launch().catch(() => backend);
    }

    async function initLanguageSelect(){
        languageSelect.addEventListener("change", async (e: Event) => {
            await backend.shutdown();
            initBackend((e.target as HTMLInputElement).value)
        });
    }

    function initTextAreas(){

    }

    async function runCode(){
        outputArea.value = "";
        await backend.runCode(codeArea.value);
    }

    function initButtons(){
        document.getElementById(RUN_BTN_ID)?.addEventListener("click", () => runCode());
    }

    init();
}