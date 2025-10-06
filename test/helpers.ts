import {Papyros} from "../src/frontend/state/Papyros";
import {RunState} from "../src/frontend/state/Runner";

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

export async function waitForInputReady(timeout = 2000): Promise<void> {
    await navigator.serviceWorker.ready;
    const start = Date.now();
    while (!navigator.serviceWorker.controller) {
        if (Date.now() - start > timeout) {
            throw new Error("Timeout waiting for service worker to control this page");
        }
        await new Promise(r => setTimeout(r, 20));
    }
}
