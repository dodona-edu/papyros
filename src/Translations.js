/* eslint-disable max-len */
// Empty strings are considered missing by i18n-extract
// Therefore the ready-key is an explicit space now, which is still invisible

const ENGLISH_TRANSLATION = {
    "Papyros": "Papyros",
    "code": "Code",
    "code_placeholder": "Write your %{programmingLanguage} code here and click 'Run' to execute...",
    "input": "Input",
    "input_placeholder": {
        "interactive": "Provide input and press enter to send",
        "batch": "Provide all input required by your code here.\n" +
            "You can enter multiple lines by pressing enter."
    },
    "input_disabled": "You can only provide input when your code requires it in interactive mode",
    "output": "Output",
    "output_placeholder": "The output of your code will appear here.",
    "run": "Run",
    "stop": "Stop",
    "finished": "Code executed in %{time} s",
    "interrupted": "Code interrupted after %{time} s",
    "states": {
        "running": "Running",
        "stopping": "Stopping",
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
    "switch_input_mode_to": {
        "interactive": "Switch to interactive mode",
        "batch": "Switch to batch input"
    },
    "enter": "Enter",
    "examples": "Examples",
    "dark_mode": "Dark mode",
    "output_overflow": "Output truncated.\nClick here to download the results.",
    "no_output": "The code did not produce any output.",
    "service_worker_error": "The service worker failed to load.",
    "launch_error": "Papyros failed to load. Do you want to reload?"
};

const DUTCH_TRANSLATION = {
    "Papyros": "Papyros",
    "code": "Code",
    "code_placeholder": "Schrijf hier je %{programmingLanguage} code en klik op 'Run' om uit te voeren...",
    "input": "Invoer",
    "input_placeholder": {
        "interactive": "Geef invoer in en druk op enter",
        "batch": "Geef hier alle invoer die je code nodig heeft vooraf in.\n" +
            "Je kan verschillende lijnen ingeven door op enter te drukken."
    },
    "input_disabled": "Je kan enkel invoer invullen als je code erom vraagt in interactieve modus",
    "output": "Uitvoer",
    "output_placeholder": "Hier komt de uitvoer van je code.",
    "run": "Run",
    "stop": "Stop",
    "states": {
        "running": "Aan het uitvoeren",
        "stopping": "Aan het stoppen",
        "loading": "Aan het laden",
        "awaiting_input": "Aan het wachten op invoer",
        "ready": " ",
    },
    "finished": "Code uitgevoerd in %{time} s",
    "interrupted": "Code onderbroken na %{time} s",
    "programming_language": "Programmeertaal",
    "programming_languages": {
        "Python": "Python",
        "JavaScript": "JavaScript"
    },
    "locales": {
        "en": "English",
        "nl": "Nederlands"
    },
    "switch_input_mode_to": {
        "interactive": "Wissen naar interactieve invoer",
        "batch": "Geef invoer vooraf in"
    },
    "enter": "Enter",
    "examples": "Voorbeelden",
    "dark_mode": "Donkere modus",
    "output_overflow": "Uitvoer ingekort. Klik hier om de resultaten te downloaden.",
    "no_output": "De code produceerde geen uitvoer.",
    "service_worker_error": "Er liep iets fout bij het laden van de service worker.",
    "launch_error": "Er liep iets fout bij het laden van Papyros. Wil je herladen?"
};

const TRANSLATIONS = {
    en: { "Papyros": ENGLISH_TRANSLATION },
    nl: { "Papyros": DUTCH_TRANSLATION }
};
// JS exports to allow use in TS and JS files
module.exports.TRANSLATIONS = TRANSLATIONS;
