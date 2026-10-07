import { afterEach, describe, expect, it, vi } from "vitest";
import { debounce } from "../../src/util/Util";

describe("debounce", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("runs only the last call after the delay", () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const debounced = debounce(fn, 300);
        debounced("a");
        debounced("b");
        vi.advanceTimersByTime(299);
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledExactlyOnceWith("b");
    });

    it("runs the pending call at once on flush, and not again later", () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const debounced = debounce(fn, 300);
        debounced("a");
        debounced.flush();
        expect(fn).toHaveBeenCalledExactlyOnceWith("a");
        vi.advanceTimersByTime(300);
        debounced.flush();
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
