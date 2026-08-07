import { Papyros } from "../src/frontend/state/Papyros";
import { RunState } from "../src/frontend/state/Runner";
import { ProgrammingLanguage } from "../src/ProgrammingLanguage";
import { InputMode } from "../src/frontend/state/InputOutput";

/**
 * Create and launch a Papyros for the given language. Selecting the language before
 * launching means only that language's worker ever boots: JavaScript tests skip the
 * Pyodide boot the default Python backend would otherwise pay.
 */
export async function launchPapyros(
    language: ProgrammingLanguage = ProgrammingLanguage.Python,
    options: { allowJspi?: boolean } = {},
): Promise<Papyros> {
    const papyros = new Papyros();
    if (options.allowJspi !== undefined) {
        papyros.runner.allowJspi = options.allowJspi;
    }
    papyros.runner.programmingLanguage = language;
    await papyros.launch();
    await papyros.runner.backend;
    return papyros;
}

/**
 * Settle a shared instance between tests: wait out any straggling run and put the
 * input state back to its defaults. Booting Pyodide once per file and reusing the
 * instance is what keeps the suite fast, so tests pay a small reset instead.
 */
export async function settlePapyros(papyros: Papyros, language?: ProgrammingLanguage): Promise<void> {
    await waitForPapyrosReady(papyros, 60000);
    if (language !== undefined && papyros.runner.programmingLanguage !== language) {
        papyros.runner.programmingLanguage = language;
        await papyros.runner.backend;
    }
    papyros.debugger.active = false;
    papyros.io.inputMode = InputMode.interactive;
    papyros.io.inputBuffer = "";
    papyros.io.reset();
}

/**
 * Delete everything user code left in the shared interpreter's workspace, for tests
 * whose assertions are sensitive to files created by earlier tests.
 */
export async function wipeWorkspace(papyros: Papyros): Promise<void> {
    await waitForPapyrosReady(papyros, 60000);
    const code = papyros.runner.code;
    papyros.runner.code = [
        "import os, shutil",
        "for __entry in os.listdir():",
        "    shutil.rmtree(__entry) if os.path.isdir(__entry) else os.remove(__entry)",
    ].join("\n");
    await papyros.runner.start();
    await waitForPapyrosReady(papyros, 60000);
    papyros.runner.code = code;
}

export async function waitForOutput(papyros: Papyros, count: number = 1, timeout = 2000): Promise<void> {
    const start = Date.now();
    while (papyros.io.output.length < count) {
        if (Date.now() - start > timeout) {
            throw new Error(`Timeout waiting for ${count} outputs`);
        }
        await new Promise(r => setTimeout(r, 10));
    }
}

export async function waitForPapyrosReady(papyros: Papyros, timeout = 2000): Promise<void> {
    const start = Date.now();
    while (papyros.runner.state != RunState.Ready) {
        if (Date.now() - start > timeout) {
            throw new Error("Timeout waiting for runner to be ready");
        }
        await new Promise(r => setTimeout(r, 10));
    }
}

/**
 * Wait until this instance's backend can actually receive input. Nothing to wait for
 * unless the backend reads from a service worker channel: JSPI resolves a promise and
 * an atomics channel needs no service worker, so those return immediately instead of
 * burning the timeout like the old controller poll did on every JSPI test.
 *
 * Never awaits navigator.serviceWorker.ready: that only settles once a registration is
 * active, and Papyros does not register one at all when the browser can suspend the wasm
 * stack. Times out quietly instead, since a test that truly needs the channel fails on
 * its own soon after.
 */
export async function waitForInputReady(papyros: Papyros, timeout = 5000): Promise<void> {
    const backend = await papyros.runner.backend;
    if (backend.usesPromiseTransport || papyros.channel?.type === "atomics") {
        return;
    }
    const start = Date.now();
    while (!navigator.serviceWorker.controller) {
        if (Date.now() - start > timeout) {
            return;
        }
        await new Promise(r => setTimeout(r, 20));
    }
}

export async function waitForRunning(papyros: Papyros, timeout = 60000): Promise<void> {
    const start = Date.now();
    while (papyros.runner.state !== RunState.Running) {
        if (Date.now() - start > timeout) {
            throw new Error(`Timeout waiting for runner to run, still ${papyros.runner.state}`);
        }
        await new Promise(r => setTimeout(r, 10));
    }
}

export async function waitForAwaitingInput(papyros: Papyros, timeout: number = 5000): Promise<void> {
    const start = Date.now();
    while (!papyros.io.awaitingInput) {
        if (Date.now() - start > timeout) {
            throw new Error("Timeout waiting for awaiting input");
        }
        await new Promise(r => setTimeout(r, 10));
    }
}

export async function waitForFiles(papyros: Papyros, count: number = 1, timeout = 10000): Promise<void> {
    const start = Date.now();
    while (papyros.io.files.length < count) {
        if (Date.now() - start > timeout) {
            throw new Error(`Timeout waiting for ${count} files`);
        }
        await new Promise(r => setTimeout(r, 10));
    }
}

export async function waitForSleeping(papyros: Papyros, timeout = 60000): Promise<void> {
    const start = Date.now();
    while ((await papyros.runner.backend).state !== "sleeping") {
        if (Date.now() - start > timeout) {
            throw new Error("Timeout waiting for the backend to sleep");
        }
        await new Promise(r => setTimeout(r, 10));
    }
}
