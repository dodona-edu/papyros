import { describe, it, expect } from "vitest";
import { materializeFrame } from "../../../src/frontend/state/DebuggerFrames";
import { NonExceptionFrame } from "@dodona/trace-component/dist/trace_types";
import { PapyrosError } from "../../../src/frontend/state/PapyrosErrors";

function fullFrame(overrides: Partial<NonExceptionFrame> = {}): NonExceptionFrame {
    return {
        line: 1,
        event: "step_line",
        func_name: "<module>",
        globals: { x: 1, y: ["REF", 1] },
        ordered_globals: ["x", "y"],
        stack_to_render: [],
        heap: { "1": ["LIST", 1, 2, 3] },
        ...overrides,
    };
}

describe("materializeFrame", () => {
    it("passes full frames through unchanged", () => {
        const frame = fullFrame();
        const materialized = materializeFrame(undefined, frame);
        expect(materialized).toEqual(frame);
    });

    it("throws when a delta frame has no previous frame", () => {
        const delta = {
            delta: true,
            line: 2,
            event: "step_line",
            func_name: "<module>",
            stack_to_render: [],
            ordered_globals: ["x"],
            globals_set: { x: 2 },
            globals_del: [],
            heap_set: {},
            heap_del: [],
        };
        expect(() => materializeFrame(undefined, delta)).toThrow(PapyrosError);
    });

    it("applies globals_set/globals_del and heap_set/heap_del onto the previous frame", () => {
        const previous = fullFrame();
        const delta = {
            delta: true,
            line: 2,
            event: "step_line",
            func_name: "<module>",
            stack_to_render: [],
            ordered_globals: ["x", "z"],
            globals_set: { x: 2, z: 3 },
            globals_del: ["y"],
            heap_set: { "2": ["LIST", 4, 5] },
            heap_del: ["1"],
        };

        const materialized = materializeFrame(previous, delta) as NonExceptionFrame;

        expect(materialized.line).toBe(2);
        expect(materialized.globals).toEqual({ x: 2, z: 3 });
        expect(materialized.heap).toEqual({ "2": ["LIST", 4, 5] });
        expect(materialized).not.toHaveProperty("delta");
        expect(materialized).not.toHaveProperty("globals_set");
        expect(materialized).not.toHaveProperty("globals_del");
        expect(materialized).not.toHaveProperty("heap_set");
        expect(materialized).not.toHaveProperty("heap_del");
    });

    it("keeps unchanged heap entries as the same object reference (structural sharing)", () => {
        const previous = fullFrame({ heap: { "1": ["LIST", 1, 2, 3], "2": ["LIST", 9] } });
        const delta = {
            delta: true,
            line: 2,
            event: "step_line",
            func_name: "<module>",
            stack_to_render: [],
            ordered_globals: ["x", "y"],
            globals_set: {},
            globals_del: [],
            heap_set: { "2": ["LIST", 9, 10] },
            heap_del: [],
        };

        const materialized = materializeFrame(previous, delta) as NonExceptionFrame;

        expect(materialized.heap["1"]).toBe(previous.heap["1"]);
        expect(materialized.heap["2"]).not.toBe(previous.heap["2"]);
        expect(materialized.heap["2"]).toEqual(["LIST", 9, 10]);
    });

    it("chains multiple deltas, sharing entries untouched across the whole chain", () => {
        const first = fullFrame({ heap: { "1": ["LIST", 1], "2": ["LIST", 2] } });
        const secondDelta = {
            delta: true,
            line: 2,
            event: "step_line",
            func_name: "<module>",
            stack_to_render: [],
            ordered_globals: ["x", "y"],
            globals_set: { x: 2 },
            globals_del: [],
            heap_set: { "3": ["LIST", 3] },
            heap_del: [],
        };
        const second = materializeFrame(first, secondDelta) as NonExceptionFrame;

        const thirdDelta = {
            delta: true,
            line: 3,
            event: "step_line",
            func_name: "<module>",
            stack_to_render: [],
            ordered_globals: ["x", "y"],
            globals_set: {},
            globals_del: [],
            heap_set: {},
            heap_del: ["3"],
        };
        const third = materializeFrame(second, thirdDelta) as NonExceptionFrame;

        expect(third.heap["1"]).toBe(first.heap["1"]);
        expect(third.heap["2"]).toBe(first.heap["2"]);
        expect(third.heap["3"]).toBeUndefined();
    });

    it("a later full frame resets reconstruction state instead of being applied as a delta", () => {
        const previous = fullFrame();
        const nextFull = fullFrame({ line: 5, globals: { a: 1 }, heap: { "9": ["LIST", 1] } });

        const materialized = materializeFrame(previous, nextFull);

        expect(materialized).toEqual(nextFull);
    });

    it("carries extra full-frame keys like exception_msg through verbatim", () => {
        const previous = fullFrame();
        const delta = {
            delta: true,
            line: 4,
            event: "exception",
            func_name: "<module>",
            stack_to_render: [],
            ordered_globals: ["x", "y"],
            globals_set: {},
            globals_del: [],
            heap_set: {},
            heap_del: [],
            exception_msg: "boom",
        };

        const materialized = materializeFrame(previous, delta) as NonExceptionFrame;

        expect(materialized.exception_msg).toBe("boom");
    });
});
