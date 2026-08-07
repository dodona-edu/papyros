/**
 * Vendored from comsync (https://github.com/alexmojaki/comsync) and
 * pyodide-worker-runner (https://github.com/alexmojaki/pyodide-worker-runner).
 * Copyright (c) 2022 Alex Hall. MIT licensed, see THIRD-PARTY-NOTICES.md.
 */
import { Channel, readMessage } from "./channel";
import { InterruptError, NoChannelError } from "./errors";

/**
 * Helpers handed to a backend method so it can block until the main thread answers
 */
export interface SyncExtras {
    channel: Channel | null;
    /**
     * Buffer that lets the main thread raise KeyboardInterrupt in Pyodide.
     * Only available when SharedArrayBuffer is, so null without COOP/COEP.
     */
    interruptBuffer: Int32Array | null;
    readMessage: () => any;
    syncSleep: (ms: number) => void;
    /**
     * Tell the client the backend has started waiting on the main thread ("reading" or
     * "sleeping"), or that a sleep ran to completion ("slept"). There is no counterpart
     * for input: the client already knows it answered, and moves itself back to running.
     *
     * The sync helpers above report this themselves. A backend that blocks another way
     * (JSPI stack switching) has to report it, or the client state machine will not know
     * it is waiting and will interrupt by replacing the worker instead of answering.
     */
    reportStatus: (status: Exclude<SyncMessageCallbackStatus, "init">) => void;
}

export type SyncMessageCallbackStatus = "init" | "reading" | "sleeping" | "slept";
export type SyncMessageCallback = (status: SyncMessageCallbackStatus) => void;

export function makeMessageId(base: string, seq: number): string {
    return `${base}-${seq}`;
}

/**
 * Wrap a backend method so that SyncClient.call can drive it from the main thread.
 * The wrapped method receives a SyncExtras as its first argument.
 */
export function expose<T extends any[], R>(
    func: (extras: SyncExtras, ...args: T) => R,
): (
    channel: Channel | null,
    syncMessageCallback: SyncMessageCallback,
    messageIdBase: string,
    interruptBuffer: Int32Array | null,
    ...args: T
) => Promise<R> {
    return async function (
        channel: Channel | null,
        syncMessageCallback: SyncMessageCallback,
        messageIdBase: string,
        interruptBuffer: Int32Array | null,
        ...args: T
    ): Promise<R> {
        await syncMessageCallback("init");
        let messageIdSeq = 0;

        function block(status: "reading" | "sleeping", options?: { timeout: number }): any {
            if (!channel) {
                throw new NoChannelError();
            }
            syncMessageCallback(status);
            const messageId = makeMessageId(messageIdBase, ++messageIdSeq);
            const response = readMessage(channel, messageId, options);
            if (response) {
                const { message, interrupted } = response;
                if (interrupted) {
                    throw new InterruptError();
                }
                return message;
            } else if (status === "sleeping") {
                syncMessageCallback("slept");
            }
        }

        const extras: SyncExtras = {
            channel,
            interruptBuffer,
            reportStatus: syncMessageCallback,
            readMessage(): any {
                return block("reading");
            },
            syncSleep(ms: number): void {
                if (!(ms > 0)) {
                    return;
                }
                block("sleeping", { timeout: ms });
            },
        };
        return func(extras, ...args);
    };
}
