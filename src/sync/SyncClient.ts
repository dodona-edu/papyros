/**
 * Vendored from comsync (https://github.com/alexmojaki/comsync) and
 * pyodide-worker-runner (https://github.com/alexmojaki/pyodide-worker-runner).
 * Copyright (c) 2022 Alex Hall. MIT licensed, see THIRD-PARTY-NOTICES.md.
 */
import { Channel, uuidv4, writeMessage } from "./channel";
import { InterruptError } from "./errors";
import { makeMessageId, SyncMessageCallback } from "./expose";
import * as Comlink from "comlink";

/**
 * Drives a worker whose methods were wrapped with `expose`, from the main thread.
 *
 * A worker blocked on input cannot answer Comlink messages, so every decision here is
 * made from state tracked on this side. Asking the worker would deadlock whenever it is busy.
 */
export class SyncClient<T = any> {
    public interrupter?: () => void;
    /**
     * Whether the worker suspends on a promise instead of reading from the channel.
     * Set from the worker's own probe after launching; delivery routes accordingly.
     */
    public usesPromiseTransport = false;
    public state: "idle" | "running" | "awaitingMessage" | "sleeping" = "idle";
    private _worker?: Worker;
    private _workerProxy?: Comlink.Remote<T>;

    private _interruptRejector?: (reason?: any) => void;
    private _interruptPromise?: Promise<void>;

    private _messageIdBase?: string;
    private _messageIdSeq = 0;

    private _awaitingMessageResolve?: () => void;

    public get worker(): Worker {
        return this._worker!;
    }

    public get workerProxy(): Comlink.Remote<T> {
        return this._workerProxy!;
    }

    public constructor(
        public workerCreator: () => Worker,
        public channel?: Channel | null,
    ) {
        this._start();
    }

    /**
     * Stop the running call. A worker blocked on input or sleep is told through the channel,
     * anything else needs the interrupt buffer, and without one the worker is replaced.
     */
    public async interrupt(): Promise<void> {
        if (this.state === "idle") {
            return;
        }

        if (this.state === "awaitingMessage" || this.state === "sleeping") {
            await this._writeMessage({ interrupted: true });
            return;
        }

        if (this.interrupter) {
            await this.interrupter();
            return;
        }

        this.restart();
    }

    /**
     * Replace the worker with a fresh one, dropping everything the old one held.
     * This client keeps its identity, so callers holding it stay valid.
     */
    public restart(): void {
        this.terminate();
        this._start();
    }

    public async call(proxyMethod: any, ...args: any[]): Promise<any> {
        if (this.state !== "idle") {
            throw new Error(`State is ${this.state}, not idle`);
        }

        let runningThisTask = true;
        this.state = "running";

        this._messageIdBase = uuidv4();
        this._messageIdSeq = 0;

        const syncMessageCallback: SyncMessageCallback = (status) => {
            if (!runningThisTask || status === "init") {
                return;
            }

            if (status === "reading") {
                this.state = "awaitingMessage";
                this._messageIdSeq++;
                this._awaitingMessageResolve?.();
            } else if (status === "sleeping") {
                this.state = "sleeping";
                this._messageIdSeq++;
            } else if (status === "slept") {
                this.state = "running";
            }
        };

        const interruptBuffer = this._makeInterruptBuffer();

        this._interruptPromise = new Promise((resolve, reject) => (this._interruptRejector = reject));

        try {
            return await Promise.race([
                proxyMethod(
                    this.channel,
                    Comlink.proxy(syncMessageCallback),
                    this._messageIdBase,
                    interruptBuffer,
                    ...args,
                ),
                this._interruptPromise,
            ]);
        } finally {
            runningThisTask = false;
            this._reset();
        }
    }

    public async writeMessage(message: any): Promise<void> {
        if (this.state === "idle" || !this._messageIdBase) {
            throw new Error("No active call to send a message to.");
        }

        if (this.state !== "awaitingMessage") {
            if (this._awaitingMessageResolve) {
                throw new Error("Not waiting for message, and another write is already queued.");
            }

            await new Promise<void>((resolve) => {
                this._awaitingMessageResolve = resolve;
            });
            delete this._awaitingMessageResolve;

            // The call can end while the write is queued, which wakes it without any
            // reader left to hand the message to
            if (!this._messageIdBase) {
                throw new Error("No active call to send a message to.");
            }
        }

        await this._writeMessage({ message });
    }

    public terminate(): void {
        this._interruptRejector?.(new InterruptError("Worker terminated"));
        // A client that was already terminated has nothing left to release, so
        // terminating it again is a no-op rather than an error
        this._workerProxy?.[Comlink.releaseProxy]();
        this._worker?.terminate();
        delete this._workerProxy;
        delete this._worker;
    }

    /**
     * Pyodide can only raise KeyboardInterrupt through a shared buffer, which needs COOP/COEP.
     * Without one, `interrupt` falls back to replacing the worker.
     */
    private _makeInterruptBuffer(): Int32Array | null {
        if (typeof SharedArrayBuffer === "undefined") {
            return null;
        }
        const buffer = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
        this.interrupter = (): void => {
            buffer[0] = 2;
        };
        return buffer;
    }

    private async _writeMessage(message: any): Promise<void> {
        this.state = "running";
        if (this.usesPromiseTransport) {
            const proxy = this._workerProxy as any;
            await (message.interrupted ? proxy.interruptMessage() : proxy.receiveMessage(message.message));
            return;
        }
        const messageId = makeMessageId(this._messageIdBase!, this._messageIdSeq);
        await writeMessage(this.channel!, message, messageId);
    }

    private _start(): void {
        this._reset();
        this._worker = this.workerCreator();
        this._workerProxy = Comlink.wrap<T>(this._worker);
    }

    private _reset(): void {
        this.state = "idle";
        delete this._interruptPromise;
        delete this._interruptRejector;
        delete this._messageIdBase;
        // Wake a queued writeMessage so it fails fast rather than waiting forever
        const awaitingMessageResolve = this._awaitingMessageResolve;
        delete this._awaitingMessageResolve;
        awaitingMessageResolve?.();
    }
}
