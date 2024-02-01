import "./Papyros.css";
import {
    addPapyrosPrefix,
    DEFAULT_LOCALE, DEFAULT_PROGRAMMING_LANGUAGE,
    DEFAULT_SERVICE_WORKER
} from "./Constants";
import { Papyros, PapyrosConfig } from "./Papyros";
import { InputMode } from "./InputManager";
import { BatchInputHandler } from "./input/BatchInputHandler";
import { CodeMirrorEditor } from "./editor/CodeMirrorEditor";

const LOCAL_STORAGE_KEYS = {
    code: addPapyrosPrefix("previous-code"),
    input: addPapyrosPrefix("previous-batch-input")
};

function setUpEditor(editor: CodeMirrorEditor, storageKey: string): void {
    const previousValue = window.localStorage.getItem(storageKey);
    if (previousValue) {
        editor.setText(previousValue);
    }
    editor.onChange(
        {
            onChange: (text: string) => {
                window.localStorage.setItem(storageKey, text);
            },
            delay: 0
        }
    );
}

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
        inputMode: InputMode.Batch,
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
        darkMode: darkMode,
        traceOptions: {
            parentElementId: "trace-root"
        }
    });
    setUpEditor(papyros.codeRunner.editor, LOCAL_STORAGE_KEYS.code);
    papyros.codeRunner.editor.focus();
    const handler = papyros.codeRunner.inputManager.getInputHandler(InputMode.Batch);
    if (handler instanceof BatchInputHandler) {
        setUpEditor((handler as BatchInputHandler).batchEditor, LOCAL_STORAGE_KEYS.input);
    }

    await papyros.launch();

    // add test code
    const testCode = "print('a')\nprint(\"Hello World!\")\nprint('b')";
    papyros.codeRunner.editor.testCode = testCode;
}

startPapyros();
