// Empty strings are considered missing by i18n-extract
// Therefore the ready-key is an explicit space now, which is still invisible

const ENGLISH_TRANSLATION = {
    "Papyros": "Papyros",
    "code": "Code",
    "code_placeholder": "Enter your code here",
    "input": "Input",
    "input_placeholder": "Provide input here",
    "output": "Output",
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
    "input_modes": {
        "switch_to_interactive": "Switch to interactive mode",
        "switch_to_batch": "Switch to batch input"
    },
    "enter": "Enter"
};

const DUTCH_TRANSLATION = {
    "Papyros": "Papyros",
    "code": "Code",
    "code_placeholder": "Voer hier je code in",
    "input": "Invoer",
    "input_placeholder": "Geef hier invoer in",
    "output": "Uitvoer",
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
    },
    "input_modes": {
        "switch_to_interactive": "Wissel naar interactieve invoer",
        "switch_to_batch": "Geef invoer vooraf in"
    },
    "enter": "Enter"
};

// JS exports to allow use in TS and JS files
// eslint-disable-next-line no-undef
module.exports = {
    en: { "Papyros": ENGLISH_TRANSLATION },
    nl: { "Papyros": DUTCH_TRANSLATION }
};
