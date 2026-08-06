import { describe, expect, it, vi } from "vitest";
import { expose, SyncExtras } from "../../../src/sync/expose";
import { NoChannelError } from "../../../src/sync/errors";
import { makeServiceWorkerChannel } from "../../../src/sync/channel";

const noop = (): void => undefined;

describe("expose", () => {
    it("hands the wrapped function a SyncExtras and forwards the remaining arguments", async () => {
        const seen: SyncExtras[] = [];
        const wrapped = expose((extras: SyncExtras, a: number, b: number) => {
            seen.push(extras);
            return a + b;
        });

        const channel = makeServiceWorkerChannel();
        const buffer = new Int32Array(1);
        expect(await wrapped(channel, noop, "base", buffer, 1, 2)).toBe(3);
        expect(seen[0].channel).toBe(channel);
        expect(seen[0].interruptBuffer).toBe(buffer);
    });

    it("announces itself before running so the client can track state", async () => {
        const callback = vi.fn();
        await expose(() => undefined)(null, callback, "base", null);
        expect(callback).toHaveBeenCalledWith("init");
    });

    it("reports a missing channel rather than blocking forever", async () => {
        const wrapped = expose((extras: SyncExtras) => extras.readMessage());
        await expect(wrapped(null, noop, "base", null)).rejects.toBeInstanceOf(NoChannelError);
    });

    it("skips a sleep of zero or less without touching the channel", async () => {
        const callback = vi.fn();
        await expose((extras: SyncExtras) => extras.syncSleep(0))(null, callback, "base", null);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith("init");
    });
});
