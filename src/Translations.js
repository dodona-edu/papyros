// Empty strings are considered missing by i18n-extract
// Therefore the ready-key is an explicit space now, which is still invisible

const ENGLISH_TRANSLATION = {
    "Papyros": "Papyros",
    "code": "Code",
    "code_placeholder": "Enter your code here",
    "input": "Input",
    "input_placeholder": {
        "interactive": "Provide input here. Press enter to send.",
        "batch": "Provide all input required by your code here.\n" +
            "You can enter multiple lines by pressing enter."
    },
    "output": "Output",
    "output_placeholder": "The output of your code will be shown here",
    "run": "Run",
    "terminate": "Terminate",
    "finished": "Code executed in %{time} s",
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
    "input_placeholder": {
        "interactive": "Geef hier je invoer in. Duw op enter om te verzenden.",
        "batch": "Geef hier alle invoer die je code nodig heeft vooraf in.\n" +
            "Je kan verschillende lijnen ingeven door op enter te drukken."
    },
    "output": "Uitvoer",
    "output_placeholder": "Hier komt de uitvoer van je code",
    "run": "Voer uit",
    "terminate": "Stop uitvoering",
    "states": {
        "running": "Aan het uitvoeren",
        "terminating": "Aan het stoppen",
        "loading": "Aan het laden",
        "awaiting_input": "Aan het wachten op invoer",
        "ready": " ",
    },
    "finished": "Code uitgevoerd in %{time} s",
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
