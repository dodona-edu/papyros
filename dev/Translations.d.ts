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
    export const Papyros: string;
    export const code: string;
    export const code_placeholder: string;
    export const input: string;
    export namespace input_placeholder {
        const interactive: string;
        const batch: string;
    }
    export const input_disabled: string;
    export const output: string;
    export const output_placeholder: string;
    export const run: string;
    export const stop: string;
    export const finished: string;
    export const interrupted: string;
    export namespace states {
        const running: string;
        const stopping: string;
        const loading: string;
        const awaiting_input: string;
        const ready: string;
    }
    export const programming_language: string;
    export namespace programming_languages {
        const Python: string;
        const JavaScript: string;
    }
    export namespace locales {
        const en_1: string;
        export { en_1 as en };
        const nl_1: string;
        export { nl_1 as nl };
    }
    export namespace switch_input_mode_to {
        const interactive_1: string;
        export { interactive_1 as interactive };
        const batch_1: string;
        export { batch_1 as batch };
    }
    export const enter: string;
    export const examples: string;
    export const dark_mode: string;
    export const output_overflow: string;
    export const output_overflow_download: string;
    export const no_output: string;
    export const service_worker_error: string;
    export const launch_error: string;
    const loading_1: string;
    export { loading_1 as loading };
    export namespace run_modes {
        const doctest: string;
    }
    export const used_input: string;
    export const used_input_with_prompt: string;
}
declare namespace DUTCH_TRANSLATION {
    const Papyros_1: string;
    export { Papyros_1 as Papyros };
    const code_1: string;
    export { code_1 as code };
    const code_placeholder_1: string;
    export { code_placeholder_1 as code_placeholder };
    const input_1: string;
    export { input_1 as input };
    export namespace input_placeholder_1 {
        const interactive_2: string;
        export { interactive_2 as interactive };
        const batch_2: string;
        export { batch_2 as batch };
    }
    export { input_placeholder_1 as input_placeholder };
    const input_disabled_1: string;
    export { input_disabled_1 as input_disabled };
    const output_1: string;
    export { output_1 as output };
    const output_placeholder_1: string;
    export { output_placeholder_1 as output_placeholder };
    const run_1: string;
    export { run_1 as run };
    const stop_1: string;
    export { stop_1 as stop };
    export namespace states_1 {
        const running_1: string;
        export { running_1 as running };
        const stopping_1: string;
        export { stopping_1 as stopping };
        const loading_2: string;
        export { loading_2 as loading };
        const awaiting_input_1: string;
        export { awaiting_input_1 as awaiting_input };
        const ready_1: string;
        export { ready_1 as ready };
    }
    export { states_1 as states };
    const finished_1: string;
    export { finished_1 as finished };
    const interrupted_1: string;
    export { interrupted_1 as interrupted };
    const programming_language_1: string;
    export { programming_language_1 as programming_language };
    export namespace programming_languages_1 {
        const Python_1: string;
        export { Python_1 as Python };
        const JavaScript_1: string;
        export { JavaScript_1 as JavaScript };
    }
    export { programming_languages_1 as programming_languages };
    export namespace locales_1 {
        const en_2: string;
        export { en_2 as en };
        const nl_2: string;
        export { nl_2 as nl };
    }
    export { locales_1 as locales };
    export namespace switch_input_mode_to_1 {
        const interactive_3: string;
        export { interactive_3 as interactive };
        const batch_3: string;
        export { batch_3 as batch };
    }
    export { switch_input_mode_to_1 as switch_input_mode_to };
    const enter_1: string;
    export { enter_1 as enter };
    const examples_1: string;
    export { examples_1 as examples };
    const dark_mode_1: string;
    export { dark_mode_1 as dark_mode };
    const output_overflow_1: string;
    export { output_overflow_1 as output_overflow };
    const output_overflow_download_1: string;
    export { output_overflow_download_1 as output_overflow_download };
    const no_output_1: string;
    export { no_output_1 as no_output };
    const service_worker_error_1: string;
    export { service_worker_error_1 as service_worker_error };
    const launch_error_1: string;
    export { launch_error_1 as launch_error };
    const loading_3: string;
    export { loading_3 as loading };
    export namespace run_modes_1 {
        const doctest_1: string;
        export { doctest_1 as doctest };
    }
    export { run_modes_1 as run_modes };
    const used_input_1: string;
    export { used_input_1 as used_input };
    const used_input_with_prompt_1: string;
    export { used_input_with_prompt_1 as used_input_with_prompt };
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
