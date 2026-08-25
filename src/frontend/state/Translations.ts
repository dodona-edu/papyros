/**
 * Every key here must exist in both locales and be used somewhere in src, except for the
 * CodeMirror block, whose English phrases CodeMirror already ships. Translations.test.ts
 * enforces both.
 */

export const ENGLISH_TRANSLATION = {
    Papyros: {
        Papyros: "Papyros",
        code_placeholder: "Write your %{programmingLanguage} code here and click 'Run' to execute...",
        input_placeholder: {
            interactive: "Provide input and press enter to send",
            batch:
                "Provide all input required by your code here.\n" + "You can enter multiple lines by pressing enter.",
        },
        output_placeholder: "The output of your code will appear here.",
        debug_placeholder: "The debugger output will appear here.",
        stop: "Stop",
        finished: "Code executed in %{time} s",
        interrupted: "Code interrupted after %{time} s",
        states: {
            running: "Running",
            stopping: "Stopping",
            loading: "Loading",
            awaiting_input: "Awaiting input",
            ready: "",
            error: "Failed to load",
        },
        programming_language: "Programming language",
        locales: {
            en: "English",
            nl: "Nederlands",
        },
        input_modes: {
            interactive: "Interactive input",
            batch: "Input in advance",
        },
        enter: "Enter",
        examples: "Examples",
        output_overflow: "Output truncated. No more results will be shown.",
        output_overflow_download: "Click here to download the results.",
        service_worker_error: "The service worker failed to load.",
        launch_error: "Papyros failed to load. Do you want to reload?",
        url_fetch_error: "Failed to fetch URL: %{url}",
        loading: "Loading %{packages}.",
        run_modes: {
            doctest: "Run doctests",
            debug: "Debug",
            run: "Run",
        },
        debugger: {
            title: "Drag the slider to walk through your code.",
            text_1: "This window shows how your program works step by step. Explore to see how your program builds and stores information.",
            text_2: "You can also use the %{previous} and %{next} buttons to go to the previous or next step. The %{first} and %{last} buttons can be used to directly jump to the first or last step respectively.",
            exception_title: "The debugger crashed",
            // Accessible names: announced by screen readers, never shown on screen.
            picker_label: "Execution steps",
            slider_label: "Execution step",
            step_of: "Step %{step} of %{total}",
            first_step: "First step",
            previous_step: "Previous step",
            next_step: "Next step",
            last_step: "Last step",
            current_step: "Current step",
            call_stack: "Call stack",
            heap_objects: "Heap objects",
        },
        editor: {
            test_code: {
                description: "# Appended testcase code for debugging purposes",
                edit: "Edit",
                remove: "Remove",
            },
        },
        debug: {
            stop: "Stop debugging",
        },
        editor_tab_code: "Code",
        close_file_tab: "Remove file",
        close_file_confirm: "Are you sure you want to remove this file?",
        rename_file_tab: "Rename file",
        add_file: "Add file",
        add_file_placeholder: "filename\u2026",
        files_download: "Download",
        files_binary: "Binary file",
        output_tab_output: "Output",
        output_tab_turtle: "Turtle",
    },
    CodeMirror: {
        // Papyros
        "Press Escape followed by Tab to leave the code editor.":
            "Press Escape followed by Tab to leave the code editor.",
        // @codemirror/search
        "Go to line": "Go to line",
        go: "OK",
        Find: "Find",
        Replace: "Replace",
        next: "Next",
        previous: "Previous",
        all: "All",
        "match case": "match case",
        replace: "Replace",
        "replace all": "Replace all",
        close: "Close",
    },
};

export const DUTCH_TRANSLATION = {
    Papyros: {
        Papyros: "Papyros",
        code_placeholder: "Schrijf hier je %{programmingLanguage} code en klik op 'Uitvoeren' om uit te voeren...",
        input_placeholder: {
            interactive: "Geef invoer in en druk op enter",
            batch:
                "Geef hier alle invoer die je code nodig heeft vooraf in.\n" +
                "Je kan verschillende lijnen ingeven door op enter te drukken.",
        },
        output_placeholder: "Hier komt de uitvoer van je code.",
        debug_placeholder: "Hier komt de uitvoer van de debugger.",
        stop: "Stop",
        states: {
            running: "Aan het uitvoeren",
            stopping: "Aan het stoppen",
            loading: "Aan het laden",
            awaiting_input: "Aan het wachten op invoer",
            ready: "",
            error: "Laden mislukt",
        },
        finished: "Code uitgevoerd in %{time} s",
        interrupted: "Code onderbroken na %{time} s",
        programming_language: "Programmeertaal",
        locales: {
            en: "English",
            nl: "Nederlands",
        },
        input_modes: {
            interactive: "Interactieve invoer",
            batch: "Invoer vooraf ingeven",
        },
        enter: "Enter",
        examples: "Voorbeelden",
        output_overflow: "Uitvoer ingekort. Er zullen geen nieuwe resultaten getoond worden.",
        output_overflow_download: "Klik hier om de resultaten te downloaden.",
        service_worker_error: "Er liep iets fout bij het laden van de service worker.",
        launch_error: "Er liep iets fout bij het laden van Papyros. Wil je herladen?",
        url_fetch_error: "Kon URL niet ophalen: %{url}",
        loading: "Bezig met het installeren van %{packages}.",
        run_modes: {
            doctest: "Doctests uitvoeren",
            debug: "Debuggen",
            run: "Uitvoeren",
        },
        debugger: {
            title: "Verken je code stap voor stap",
            text_1: "Dit venster toont de werking van je programma in detail. Ontdek hoe je programma informatie opbouwt en bewaart.",
            text_2: "Gebruik de schuifbalk om door je code te wandelen. Je kan ook de %{previous} en %{next} knoppen gebruiken om naar de vorige of volgende stap te gaan. De %{first} en %{last} knoppen kunnen gebruikt worden om direct naar de eerste of laatste stap te gaan.",
            exception_title: "De debugger is vastgelopen",
            // Toegankelijkheidslabels: worden voorgelezen door schermlezers, nooit getoond.
            picker_label: "Uitvoeringsstappen",
            slider_label: "Uitvoeringsstap",
            step_of: "Stap %{step} van %{total}",
            first_step: "Eerste stap",
            previous_step: "Vorige stap",
            next_step: "Volgende stap",
            last_step: "Laatste stap",
            current_step: "Huidige stap",
            call_stack: "Call stack",
            heap_objects: "Objecten op de heap",
        },
        editor: {
            test_code: {
                description: "# Toegevoegde testcase code voor debugdoeleinden",
                edit: "Bewerk",
                remove: "Verwijder",
            },
        },
        debug: {
            stop: "Stop debugger",
        },
        editor_tab_code: "Code",
        close_file_tab: "Bestand verwijderen",
        close_file_confirm: "Weet je zeker dat je dit bestand wilt verwijderen?",
        rename_file_tab: "Bestand hernoemen",
        add_file: "Bestand toevoegen",
        add_file_placeholder: "bestandsnaam\u2026",
        files_download: "Downloaden",
        files_binary: "Binair bestand",
        output_tab_output: "Uitvoer",
        output_tab_turtle: "Turtle",
    },
    CodeMirror: {
        // Papyros
        "Press Escape followed by Tab to leave the code editor.":
            "Druk op Escape en daarna Tab om de code-editor te verlaten.",
        // @codemirror/view
        "Control character": "Controlekarakter",
        // @codemirror/fold
        "Folded lines": "Ingeklapte regels",
        "Unfolded lines": "Uitgeklapte regels",
        to: "tot",
        "folded code": "ingeklapte code",
        unfold: "uitklappen",
        "Fold line": "Regel inklappen",
        "Unfold line": "Regel uitklappen",
        // @codemirror/search
        "Go to line": "Spring naar regel",
        go: "OK",
        Find: "Zoeken",
        Replace: "Vervangen",
        next: "Volgende",
        previous: "Vorige",
        all: "Alle",
        "match case": "hoofdlettergevoelig",
        replace: "Vervangen",
        "replace all": "Alles vervangen",
        close: "Sluiten",
        "current match": "huidige overeenkomst",
        "on line": "op regel",
        // @codemirror/lint
        Diagnostics: "Problemen",
        "No diagnostics": "Geen problemen",
    },
};
