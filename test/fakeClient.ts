import { vi } from "vitest";
import { BackendEvent } from "../src/communication/BackendEvent";
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
 * its runCode settles, unless they set a runId of their own. Like the real SyncClient,
 * restart() replaces the worker and fails a pending run as interrupted.
 */
export function fakeClient(): any {
    const heldLaunches: Promise<void>[] = [];
    const fake: any = {
        worker: {},
        emit: (e: BackendEvent) => fake.callback({ runId: fake.runId, ...e }),
        // Ends the pending runCode, as the worker does after sending its End event
        finishRun: () => {
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
            fake.worker = {};
            fake.runId = undefined;
            fake.rejectRun?.({ type: "InterruptError" });
        }),
        terminate: vi.fn(),
    };
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
            return new Promise<void>((resolve) => (fake.resolveRun = resolve));
        }),
        clearWorkspace: vi.fn(() => Promise.resolve()),
        updateFile: vi.fn(() => Promise.resolve()),
    };
    return fake;
}
