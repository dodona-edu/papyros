import { DEFAULT_LOCALE, DEFAULT_PROGRAMMING_LANGUAGE, MAIN_APP_ID } from "./Constants";
import { Papyros } from "./Papyros";
import { plFromString } from "./ProgrammingLanguage";
import { InputMode } from "./InputManager";

Papyros.configureInput(false).then(success => {
    if (success) {
        return startPapyros();
    } else {
        document.getElementById(MAIN_APP_ID)!.innerHTML =
`Your browser is unsupported.
Please use a modern version of Chrome, Safari, Firefox, ...`;
    }
});


async function startPapyros(): Promise<Papyros> {
    const rootElement = document.getElementById("root")!;
    const urlParams = new URLSearchParams(window.location.search);
    const language = plFromString(urlParams.get("language") || DEFAULT_PROGRAMMING_LANGUAGE);
    const locale = urlParams.get("locale") || DEFAULT_LOCALE;
    return Papyros.fromElement(rootElement, {
        standAlone: true,
        programmingLanguage: language,
        locale: locale,
        inputMode: InputMode.Interactive,
        gridStyle: "columns"
    }).launch();
}
