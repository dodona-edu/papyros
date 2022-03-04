import {
    DEFAULT_LOCALE, DEFAULT_PROGRAMMING_LANGUAGE,
    DEFAULT_SERVICE_WORKER, MAIN_APP_ID
} from "./Constants";
import { Papyros } from "./Papyros";
import { InputMode } from "./InputManager";
import { getElement } from "./util/Util";


async function startPapyros(): Promise<void> {
    // Retrieve initial locale and programming language from URL
    // This allows easier sharing of Papyros-related links with others
    // While preventing loading an unwanted backend
    const urlParams = new URLSearchParams(window.location.search);
    const language = Papyros.toProgrammingLanguage(urlParams.get("language") ||
        DEFAULT_PROGRAMMING_LANGUAGE)!;
    const locale = urlParams.get("locale") || DEFAULT_LOCALE;
    const config = {
        standAlone: true,
        programmingLanguage: language,
        locale: locale,
        inputMode: InputMode.Interactive
    };
    const papyros = new Papyros(config);
    papyros.render({
        papyros: {
            parentElementId: "root"
        }
    });
    // Try to configure synchronous input mechanism
    if (!await papyros.configureInput(false, location.href, DEFAULT_SERVICE_WORKER)) {
        getElement(MAIN_APP_ID).innerHTML =
"Your browser is unsupported. Please use a modern version of Chrome, Safari, Firefox, ...";
    } else { // Start actual application
        papyros.launch();
    }
}

startPapyros();
