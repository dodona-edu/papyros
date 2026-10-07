import { describe, expect, it } from "vitest";
import { nextTabIndex } from "../../../src/frontend/components/tabs";

describe("nextTabIndex", () => {
    it("wraps the arrow keys around at both ends", () => {
        expect(nextTabIndex("ArrowRight", 1, 3)).toBe(2);
        expect(nextTabIndex("ArrowRight", 2, 3)).toBe(0);
        expect(nextTabIndex("ArrowLeft", 1, 3)).toBe(0);
        expect(nextTabIndex("ArrowLeft", 0, 3)).toBe(2);
    });

    it("jumps to the first and last tab with Home and End", () => {
        expect(nextTabIndex("Home", 2, 3)).toBe(0);
        expect(nextTabIndex("End", 0, 3)).toBe(2);
    });

    it("ignores other keys", () => {
        expect(nextTabIndex("Enter", 1, 3)).toBeUndefined();
        expect(nextTabIndex("ArrowDown", 1, 3)).toBeUndefined();
    });
});
