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
    "stop": "Stop",
    "finished": "Code executed in %{time} s",
    "interrupted": "Code interrupted after %{time} s",
    "states": {
        "running": "Running",
        "stopping": "Stopping",
        "loading": "Loading",
        "awaiting_input": "Awaiting input",
        "ready": "",
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
    "output_overflow": "Output truncated. No more results will be shown.",
    "output_overflow_download": "Click here to download the results.",
    "no_output": "The code did not produce any output.",
    "service_worker_error": "The service worker failed to load.",
    "launch_error": "Papyros failed to load. Do you want to reload?",
    "loading": "Loading %{packages}.",
    "run_modes": {
        "doctest": "Run doctests",
        "debug": "Debug",
        "run": "Run"
    },
    "used_input": "This line has already been used as input.",
    "used_input_with_prompt": "This line was used as input for the following prompt: %{prompt}",
    "debugger": {
        "title": "Drag the slider to walk through your code.",
        "text_1": "This window shows how your program works step by step. Explore to see how your program builds and stores information.",
        "text_2": "You can also use the %{previous} and %{next} buttons to go to the previous or next step. The %{first} and %{last} buttons can be used to directly jump to the first or last step respectively."
    },
    "editor": {
        "test_code": {
            "description": "This code is inserted by the testcase",
            "edit": "Edit",
            "remove": "Remove"
        }
    }
};

const DUTCH_TRANSLATION = {
    "Papyros": "Papyros",
    "code": "Code",
    "code_placeholder": "Schrijf hier je %{programmingLanguage} code en klik op 'Uitvoeren' om uit te voeren...",
    "input": "Invoer",
    "input_placeholder": {
        "interactive": "Geef invoer in en druk op enter",
        "batch": "Geef hier alle invoer die je code nodig heeft vooraf in.\n" +
            "Je kan verschillende lijnen ingeven door op enter te drukken."
    },
    "input_disabled": "Je kan enkel invoer invullen als je code erom vraagt in interactieve modus",
    "output": "Uitvoer",
    "output_placeholder": "Hier komt de uitvoer van je code.",
    "stop": "Stop",
    "states": {
        "running": "Aan het uitvoeren",
        "stopping": "Aan het stoppen",
        "loading": "Aan het laden",
        "awaiting_input": "Aan het wachten op invoer",
        "ready": "",
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
        "interactive": "Wisselen naar interactieve invoer",
        "batch": "Geef invoer vooraf in"
    },
    "enter": "Enter",
    "examples": "Voorbeelden",
    "dark_mode": "Donkere modus",
    "output_overflow": "Uitvoer ingekort. Er zullen geen nieuwe resultaten getoond worden.",
    "output_overflow_download": "Klik hier om de resultaten te downloaden.",
    "no_output": "De code produceerde geen uitvoer.",
    "service_worker_error": "Er liep iets fout bij het laden van de service worker.",
    "launch_error": "Er liep iets fout bij het laden van Papyros. Wil je herladen?",
    "loading": "Bezig met het installeren van %{packages}.",
    "run_modes": {
        "doctest": "Doctests uitvoeren",
        "debug": "Debuggen",
        "run": "Uitvoeren"
    },
    "used_input": "Deze regel werd al gebruikt als invoer.",
    "used_input_with_prompt": "Deze regel werd gebruikt als invoer voor de volgende vraag: %{prompt}",
    "debugger": {
        "title": "Verken je code stap voor stap",
        "text_1": "Dit venster toont de werking van je programma in detail. Ontdek hoe je programma informatie opbouwt en bewaart.",
        "text_2": "Gebruik de schuifbalk om door je code te wandelen. Je kan ook de %{previous} en %{next} knoppen gebruiken om naar de vorige of volgende stap te gaan. De %{first} en %{last} knoppen kunnen gebruikt worden om direct naar de eerste of laatste stap te gaan."
    },
    "editor": {
        "test_code": {
            "description": "Deze code werd ingevoegd door de testcase",
            "edit": "Bewerk",
            "remove": "Verwijder"
        }
    }
};

// Override some default English phrases to also use capitalized text
const ENGLISH_PHRASES = {
    // @codemirror/search
    "Go to line": "Go to line",
    "go": "OK",
    "Find": "Find",
    "Replace": "Replace",
    "next": "Next",
    "previous": "Previous",
    "all": "All",
    "match case": "match case",
    "replace": "Replace",
    "replace all": "Replace all",
    "close": "Sluiten",
}

const DUTCH_PHRASES = {
    // @codemirror/view
    "Control character": "Controlekarakter",
    // @codemirror/fold
    "Folded lines": "Ingeklapte regels",
    "Unfolded lines": "Uitgeklapte regels",
    "to": "tot",
    "folded code": "ingeklapte code",
    "unfold": "uitklappen",
    "Fold line": "Regel inklappen",
    "Unfold line": "Regel uitklappen",
    // @codemirror/search
    "Go to line": "Spring naar regel",
    "go": "OK",
    "Find": "Zoeken",
    "Replace": "Vervangen",
    "next": "Volgende",
    "previous": "Vorige",
    "all": "Alle",
    "match case": "hoofdlettergevoelig",
    "replace": "Vervangen",
    "replace all": "Alles vervangen",
    "close": "Sluiten",
    "current match": "huidige overeenkomst",
    "on line": "op regel",
    // @codemirror/lint
    "Diagnostics": "Problemen",
    "No diagnostics": "Geen problemen",
  }

const TRANSLATIONS = {
    en: { "Papyros": ENGLISH_TRANSLATION },
    nl: { "Papyros": DUTCH_TRANSLATION }
};

const CODE_MIRROR_TRANSLATIONS = {
    en: ENGLISH_PHRASES,
    nl: DUTCH_PHRASES
};
// JS exports to allow use in TS and JS files
module.exports.TRANSLATIONS = TRANSLATIONS;
module.exports.CODE_MIRROR_TRANSLATIONS = CODE_MIRROR_TRANSLATIONS;
