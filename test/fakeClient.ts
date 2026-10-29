import { vi } from "vitest";
import { BackendEvent, BackendEventType } from "../src/communication/BackendEvent";
import { RunMode } from "../src/backend/Backend";

export interface HeldLaunch {
    finish: () => void;
    fail: (error: unknown) => void;
}

/**
 * Stand-in for a SyncClient that hands out the worker's event callback, so a test
 * decides which events arrive while a run is in progress, and when that run ends.
 *
 * Like the real Backend, emitted events carry the id of the run in progress until
 * its runCode settles, unless they set a runId of their own, and a run that returns
 * sends End last unless it already sent End or Interrupt. Like the real SyncClient,
 * restart() replaces the worker and fails a pending run as interrupted, and restart()
 * and terminate() reject `terminated` of the worker they end.
 */
export function fakeClient(): any {
    const heldLaunches: Promise<void>[] = [];
    let endWorker: (reason: unknown) => void = () => undefined;
    const startWorker = (): void => {
        fake.worker = {};
        fake.terminated = new Promise<never>((_, reject) => (endWorker = reject));
        fake.terminated.catch(() => undefined);
    };
    const fake: any = {
        emit: (e: BackendEvent) => {
            const event = { runId: fake.runId, ...e };
            if ([BackendEventType.End, BackendEventType.Interrupt].includes(event.type) && event.runId === fake.runId) {
                fake.over = true;
            }
            fake.callback(event);
        },
        // Ends the pending runCode, as the worker does after sending its End event
        finishRun: () => {
            if (!fake.over) {
                fake.emit({ type: BackendEventType.End, data: "CodeFinished", contentType: "text/plain" });
            }
            fake.runId = undefined;
            fake.resolveRun();
        },
        /**
         * Make the next launch wait until the returned launch is finished or failed
         */
        holdLaunch: (): HeldLaunch => {
            const held: Partial<HeldLaunch> = {};
            heldLaunches.push(
                new Promise<void>((resolve, reject) => {
                    held.finish = resolve;
                    held.fail = reject;
                }),
            );
            return held as HeldLaunch;
        },
        call: (method: (...args: any[]) => Promise<any>, ...args: any[]) =>
            Promise.race([method(...args), new Promise((_, reject) => (fake.rejectRun = reject))]),
        interrupt: vi.fn(() => Promise.resolve()),
        writeMessage: vi.fn(() => Promise.resolve()),
        restart: vi.fn(() => {
            endWorker({ type: "InterruptError" });
            startWorker();
            fake.runId = undefined;
            fake.rejectRun?.({ type: "InterruptError" });
        }),
        terminate: vi.fn(() => endWorker({ type: "InterruptError" })),
    };
    startWorker();
    fake.workerProxy = {
        launch: vi.fn((callback: (e: BackendEvent) => void) => {
            fake.callback = callback;
            return heldLaunches.shift() ?? Promise.resolve();
        }),
        usesJspi: () => Promise.resolve(true),
        runModes: () => Promise.resolve([]),
        lintCode: vi.fn(() => Promise.resolve([])),
        runCode: vi.fn((code: string, mode: RunMode, maxSteps: number, runId: number) => {
            fake.runId = runId;
            fake.over = false;
            return new Promise<void>((resolve) => (fake.resolveRun = resolve));
        }),
        clearWorkspace: vi.fn(() => Promise.resolve()),
        updateFile: vi.fn(() => Promise.resolve()),
    };
    return fake;
}
