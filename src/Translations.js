// Empty strings are considered missing by i18n-extract
// Therefore the ready-key is an explicit space now, which is still invisible

const ENGLISH_TRANSLATION = {
    "Papyros": "Papyros",
    "enter_code": "Enter your code here",
    "enter_input": "Provide input for your code here",
    "code_output": "Code output",
    "run": "Run",
    "terminate": "Terminate",
    "finished": "Code executed in %{time} ms",
    "states": {
        "running": "Running",
        "terminating": "Terminating",
        "loading": "Loading",
        "awaiting_input": "Awaiting input",
        "ready": " ",
    },
    "programming_language": "Programming language",
    "programming_languages": {
        "Python": "Python",
        "JavaScript": "JavaScript"
    },
    "locales": {
        "en": "English",
        "nl": "Nederlands"
    },
};

const DUTCH_TRANSLATION = {
    "Papyros": "Papyros",
    "enter_code": "Voer hier je code in",
    "enter_input": "Geef hier de invoer voor je code in",
    "code_output": "Resultaat van de code",
    "run": "Voer uit",
    "terminate": "Stop uitvoering",
    "states": {
        "running": "Aan het uitvoeren",
        "terminating": "Aan het stoppen",
        "loading": "Aan het laden",
        "awaiting_input": "Aan het wachten op invoer",
        "ready": " ",
    },
    "finished": "Code uitgevoerd in %{time} ms",
    "programming_language": "Programmeertaal",
    "programming_languages": {
        "Python": "Python",
        "JavaScript": "JavaScript"
    },
    "locales": {
        "en": "English",
        "nl": "Nederlands"
    }
};

// JS exports to allow use in TS and JS files
// eslint-disable-next-line no-undef
module.exports = {
    en: { "Papyros": ENGLISH_TRANSLATION },
    nl: { "Papyros": DUTCH_TRANSLATION }
};
