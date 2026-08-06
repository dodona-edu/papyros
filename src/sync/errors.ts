/**
 * Vendored from comsync (https://github.com/alexmojaki/comsync).
 * Copyright (c) 2022 Alex Hall. MIT licensed, see THIRD-PARTY-NOTICES.md.
 */

/**
 * Raised in the worker when the main thread interrupts a running call
 */
export class InterruptError extends Error {
    // To avoid having to use instanceof
    public readonly type = "InterruptError";
    public readonly name = this.type;
}

/**
 * Raised when a backend needs to block on the main thread but has no channel to do so
 */
export class NoChannelError extends Error {
    // To avoid having to use instanceof
    public readonly type = "NoChannelError";
    public readonly name = this.type;
}
