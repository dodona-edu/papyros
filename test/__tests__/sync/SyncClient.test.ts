import { describe, expect, it } from "vitest";
import { SyncClient } from "../../../src/sync/SyncClient";
import { InterruptError } from "../../../src/sync/errors";
import { makeServiceWorkerChannel } from "../../../src/sync/channel";

function idleClient(): SyncClient {
    const url = URL.createObjectURL(new Blob([""], { type: "text/javascript" }));
    return new SyncClient(() => new Worker(url), makeServiceWorkerChannel());
}

describe("SyncClient", () => {
    it("starts idle with a worker", () => {
        const client = idleClient();
        expect(client.state).toBe("idle");
        expect(client.worker).toBeInstanceOf(Worker);
        client.terminate();
    });

    it("refuses a second concurrent call", async () => {
        const client = idleClient();
        client.state = "running";
        await expect(client.call(async () => undefined)).rejects.toThrow("State is running, not idle");
        client.terminate();
    });

    it("refuses to write a message when no call is active", async () => {
        const client = idleClient();
        await expect(client.writeMessage("hello")).rejects.toThrow("No active call to send a message to.");
        client.terminate();
    });

    it("ignores an interrupt while idle", async () => {
        const client = idleClient();
        const worker = client.worker;
        await client.interrupt();
        expect(client.state).toBe("idle");
        expect(client.worker).toBe(worker);
        client.terminate();
    });

    it("replaces the worker when interrupting a run that is not waiting for input", async () => {
        const client = idleClient();
        const worker = client.worker;
        client.state = "running";
        await client.interrupt();
        expect(client.state).toBe("idle");
        expect(client.worker).not.toBe(worker);
        client.terminate();
    });

    it("restarts into a fresh worker even when already terminated", async () => {
        const client = idleClient();
        client.terminate();

        client.restart();

        expect(client.worker).toBeInstanceOf(Worker);
        expect(client.state).toBe("idle");
        client.terminate();
    });

    it("fails a queued write instead of hanging when the call ends first", async () => {
        const client = idleClient();
        const call = client.call(() => new Promise(() => undefined));
        await Promise.resolve();
        // Not waiting for input yet, so the write queues behind the reading status
        const write = client.writeMessage("typed while still running");
        client.terminate();
        await expect(call).rejects.toBeInstanceOf(InterruptError);
        await expect(write).rejects.toThrow("No active call to send a message to.");
    });

    it("rejects the in-flight call with an InterruptError when terminated", async () => {
        const client = idleClient();
        const call = client.call(() => new Promise(() => undefined));
        await Promise.resolve();
        client.terminate();
        await expect(call).rejects.toBeInstanceOf(InterruptError);
    });
});
