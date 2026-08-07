import { Frame, Heap, TraceSubElement } from "@dodona/trace-component/dist/trace_types";
import { PapyrosError } from "./PapyrosErrors";

/**
 * A frame in the tracer's opt-in delta-v1 wire format. Carries everything a
 * full frame does except `globals` and `heap`, replaced by the changes
 * needed to derive them from the previous materialized frame.
 */
export type DeltaFrame = {
    delta: true;
    line: number;
    event: string;
    func_name: string;
    stack_to_render: unknown;
    ordered_globals: string[];
    globals_set: Record<string, TraceSubElement>;
    globals_del: string[];
    heap_set: Heap;
    heap_del: string[];
    [key: string]: unknown;
};

/**
 * Turn a frame as received from the worker into a full Frame for the trace
 * component. Full frames (no `delta` marker) pass through unchanged. Delta
 * frames are applied on top of `previous`, reusing unchanged heap entries by
 * reference so the trace only grows by what actually changed between steps.
 * @param {Frame | undefined} previous The last materialized frame, or
 * undefined at the start of a run
 * @param {unknown} parsed The frame as parsed from the worker's JSON
 * @return {Frame} The full frame
 */
export function materializeFrame(previous: Frame | undefined, parsed: unknown): Frame {
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new PapyrosError("Received a frame that is not an object");
    }
    const raw = parsed as Record<string, unknown>;
    if (raw.delta !== true) {
        return raw as Frame;
    }
    if (!previous || !("globals" in previous) || !("heap" in previous)) {
        throw new PapyrosError("Received a delta frame with no full frame to apply it to");
    }
    const deltaFrame = raw as DeltaFrame;

    const globals = { ...previous.globals };
    for (const name of deltaFrame.globals_del) {
        delete globals[name];
    }
    Object.assign(globals, deltaFrame.globals_set);

    const heap = { ...previous.heap };
    for (const id of deltaFrame.heap_del) {
        delete heap[id];
    }
    Object.assign(heap, deltaFrame.heap_set);

    const materialized = { ...raw } as Record<string, unknown>;
    delete materialized.delta;
    delete materialized.globals_set;
    delete materialized.globals_del;
    delete materialized.heap_set;
    delete materialized.heap_del;
    materialized.globals = globals;
    materialized.heap = heap;

    return materialized as Frame;
}
