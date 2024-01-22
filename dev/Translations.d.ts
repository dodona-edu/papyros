export namespace TRANSLATIONS {
    namespace en {
        export { ENGLISH_TRANSLATION as Papyros };
    }
    namespace nl {
        export { DUTCH_TRANSLATION as Papyros };
    }
}
export namespace CODE_MIRROR_TRANSLATIONS {
    export { ENGLISH_PHRASES as en };
    export { DUTCH_PHRASES as nl };
}
declare namespace ENGLISH_TRANSLATION {
    export let Papyros: string;
    export let code: string;
    export let code_placeholder: string;
    export let input: string;
    export namespace input_placeholder {
        let interactive: string;
        let batch: string;
    }
    export let input_disabled: string;
    export let output: string;
    export let output_placeholder: string;
    export let stop: string;
    export let finished: string;
    export let interrupted: string;
    export namespace states {
        let running: string;
        let stopping: string;
        let loading: string;
        let awaiting_input: string;
        let ready: string;
    }
    export let programming_language: string;
    export namespace programming_languages {
        let Python: string;
        let JavaScript: string;
    }
    export namespace locales {
        let en_1: string;
        export { en_1 as en };
        let nl_1: string;
        export { nl_1 as nl };
    }
    export namespace switch_input_mode_to {
        let interactive_1: string;
        export { interactive_1 as interactive };
        let batch_1: string;
        export { batch_1 as batch };
    }
    export let enter: string;
    export let examples: string;
    export let dark_mode: string;
    export let output_overflow: string;
    export let output_overflow_download: string;
    export let no_output: string;
    export let service_worker_error: string;
    export let launch_error: string;
    let loading_1: string;
    export { loading_1 as loading };
    export namespace run_modes {
        let doctest: string;
        let debug: string;
        let run: string;
    }
    export let used_input: string;
    export let used_input_with_prompt: string;
    export namespace _debugger {
        let title: string;
        let text_1: string;
        let text_2: string;
    }
    export { _debugger as debugger };
}
declare namespace DUTCH_TRANSLATION {
    let Papyros_1: string;
    export { Papyros_1 as Papyros };
    let code_1: string;
    export { code_1 as code };
    let code_placeholder_1: string;
    export { code_placeholder_1 as code_placeholder };
    let input_1: string;
    export { input_1 as input };
    export namespace input_placeholder_1 {
        let interactive_2: string;
        export { interactive_2 as interactive };
        let batch_2: string;
        export { batch_2 as batch };
    }
    export { input_placeholder_1 as input_placeholder };
    let input_disabled_1: string;
    export { input_disabled_1 as input_disabled };
    let output_1: string;
    export { output_1 as output };
    let output_placeholder_1: string;
    export { output_placeholder_1 as output_placeholder };
    let stop_1: string;
    export { stop_1 as stop };
    export namespace states_1 {
        let running_1: string;
        export { running_1 as running };
        let stopping_1: string;
        export { stopping_1 as stopping };
        let loading_2: string;
        export { loading_2 as loading };
        let awaiting_input_1: string;
        export { awaiting_input_1 as awaiting_input };
        let ready_1: string;
        export { ready_1 as ready };
    }
    export { states_1 as states };
    let finished_1: string;
    export { finished_1 as finished };
    let interrupted_1: string;
    export { interrupted_1 as interrupted };
    let programming_language_1: string;
    export { programming_language_1 as programming_language };
    export namespace programming_languages_1 {
        let Python_1: string;
        export { Python_1 as Python };
        let JavaScript_1: string;
        export { JavaScript_1 as JavaScript };
    }
    export { programming_languages_1 as programming_languages };
    export namespace locales_1 {
        let en_2: string;
        export { en_2 as en };
        let nl_2: string;
        export { nl_2 as nl };
    }
    export { locales_1 as locales };
    export namespace switch_input_mode_to_1 {
        let interactive_3: string;
        export { interactive_3 as interactive };
        let batch_3: string;
        export { batch_3 as batch };
    }
    export { switch_input_mode_to_1 as switch_input_mode_to };
    let enter_1: string;
    export { enter_1 as enter };
    let examples_1: string;
    export { examples_1 as examples };
    let dark_mode_1: string;
    export { dark_mode_1 as dark_mode };
    let output_overflow_1: string;
    export { output_overflow_1 as output_overflow };
    let output_overflow_download_1: string;
    export { output_overflow_download_1 as output_overflow_download };
    let no_output_1: string;
    export { no_output_1 as no_output };
    let service_worker_error_1: string;
    export { service_worker_error_1 as service_worker_error };
    let launch_error_1: string;
    export { launch_error_1 as launch_error };
    let loading_3: string;
    export { loading_3 as loading };
    export namespace run_modes_1 {
        let doctest_1: string;
        export { doctest_1 as doctest };
        let debug_1: string;
        export { debug_1 as debug };
        let run_1: string;
        export { run_1 as run };
    }
    export { run_modes_1 as run_modes };
    let used_input_1: string;
    export { used_input_1 as used_input };
    let used_input_with_prompt_1: string;
    export { used_input_with_prompt_1 as used_input_with_prompt };
    export namespace _debugger_1 {
        let title_1: string;
        export { title_1 as title };
        let text_1_1: string;
        export { text_1_1 as text_1 };
        let text_2_1: string;
        export { text_2_1 as text_2 };
    }
    export { _debugger_1 as debugger };
}
declare const ENGLISH_PHRASES: {
    "Go to line": string;
    go: string;
    Find: string;
    Replace: string;
    next: string;
    previous: string;
    all: string;
    "match case": string;
    replace: string;
    "replace all": string;
    close: string;
};
declare const DUTCH_PHRASES: {
    "Control character": string;
    "Folded lines": string;
    "Unfolded lines": string;
    to: string;
    "folded code": string;
    unfold: string;
    "Fold line": string;
    "Unfold line": string;
    "Go to line": string;
    go: string;
    Find: string;
    Replace: string;
    next: string;
    previous: string;
    all: string;
    "match case": string;
    replace: string;
    "replace all": string;
    close: string;
    "current match": string;
    "on line": string;
    Diagnostics: string;
    "No diagnostics": string;
};
export {};
