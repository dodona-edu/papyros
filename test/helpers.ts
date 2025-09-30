import {Papyros} from "../src/Papyros";

export async function waitForOutput(papyros: Papyros, count: number = 1, timeout = 2000): Promise<void> {
    const start = Date.now();
    while (papyros.io.output.length < count) {
        if (Date.now() - start > timeout) {
            throw new Error(`Timeout waiting for ${count} outputs`);
        }
        await new Promise(r => setTimeout(r, 10));
    }
}

export async function waitForInputReady(): Promise<void> {
    await navigator.serviceWorker.ready;
}
