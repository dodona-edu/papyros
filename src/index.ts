import { DEFAULT_LOCALE, DEFAULT_PROGRAMMING_LANGUAGE, MAIN_APP_ID } from "./Constants";
import { Papyros } from "./Papyros";
import { papyrosLog, LogType } from "./util/Logging";
import { plFromString } from "./ProgrammingLanguage";
import { InputMode } from "./InputManager";

const RELOAD_STORAGE_KEY = "__papyros_reloading";
const SERVICE_WORKER_PATH = "./inputServiceWorker.js";

if (window.localStorage.getItem(RELOAD_STORAGE_KEY)) {
    // We are the result of the page reload, so we can start
    window.localStorage.removeItem(RELOAD_STORAGE_KEY);
    startPapyros();
} else {
    if (typeof SharedArrayBuffer === "undefined") {
        papyrosLog(LogType.Important, "SharedArrayBuffers are not available. ");
        if ("serviceWorker" in navigator) {
            papyrosLog(LogType.Important, "Registering service worker.");
            // Store that we are reloading, to prevent the next load from doing all this again
            window.localStorage.setItem(RELOAD_STORAGE_KEY, RELOAD_STORAGE_KEY);
            navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: "" })
                // service worker adds new headers that may allow SharedArrayBuffers to be used
                .then(() => window.location.reload());
        } else {
            document.getElementById(MAIN_APP_ID)!.innerHTML =
                `Your browser is unsupported. 
                 Please use a modern version of Chrome, Safari, Firefox, ...`;
        }
    } else {
        startPapyros();
    }
}


function startPapyros(): void {
    const rootElement = document.getElementById("root")!;
    const urlParams = new URLSearchParams(window.location.search);
    const language = plFromString(urlParams.get("language") || DEFAULT_PROGRAMMING_LANGUAGE);
    const locale = urlParams.get("locale") || DEFAULT_LOCALE;
    Papyros.fromElement(rootElement, {
        standAlone: true,
        programmingLanguage: language,
        locale: locale,
        inputMode: InputMode.Interactive
    });
}
