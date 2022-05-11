import {
    DEFAULT_LOCALE, DEFAULT_PROGRAMMING_LANGUAGE,
    DEFAULT_SERVICE_WORKER
} from "./Constants";
import { Papyros, PapyrosConfig } from "./Papyros";
import { InputMode } from "./InputManager";


async function startPapyros(): Promise<void> {
    // Retrieve initial locale and programming language from URL
    // This allows easier sharing of Papyros-related links with others
    // While preventing loading an unwanted backend
    const urlParams = new URLSearchParams(window.location.search);
    const language = Papyros.toProgrammingLanguage(urlParams.get("language") ||
        DEFAULT_PROGRAMMING_LANGUAGE)!;
    const locale = urlParams.get("locale") || DEFAULT_LOCALE;
    const config: PapyrosConfig = {
        standAlone: true,
        programmingLanguage: language,
        locale: locale,
        inputMode: InputMode.Interactive,
        channelOptions: {
            serviceWorkerName: DEFAULT_SERVICE_WORKER
        }
    };
    const papyros = new Papyros(config);
    let darkMode = false;
    if (window.matchMedia) {
        darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
            papyros.setDarkMode(e.matches);
        });
    }
    papyros.render({
        standAloneOptions: {
            parentElementId: "root"
        },
        darkMode: darkMode
    });

    await papyros.launch();
}

startPapyros();
