import { describe, expect, it } from "vitest";
import { HeightTransition } from "../../../src/frontend/components/motion";

/** A host whose height comes from its content, the way a pane with swapped panels does. */
function host(contentHeight: number): { element: HTMLElement; setContent: (h: number) => void } {
    const element = document.createElement("div");
    element.style.overflow = "hidden";
    const child = document.createElement("div");
    child.style.height = `${contentHeight}px`;
    element.append(child);
    document.body.append(element);
    return { element, setContent: (h: number) => (child.style.height = `${h}px`) };
}

function frame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe("HeightTransition", () => {
    it("animates from the height captured before the content changed", async () => {
        const { element, setContent } = host(100);
        const transition = new HeightTransition(element);

        transition.capture();
        setContent(300);
        // The old height is held while the new content renders, so nothing is painted at
        // a size that is about to change.
        expect(element.getBoundingClientRect().height).toBeCloseTo(100, 0);

        await transition.play();
        const animation = element.getAnimations()[0];
        expect(animation).toBeDefined();
        expect(element.getBoundingClientRect().height).toBeCloseTo(100, 0);

        animation.finish();
        expect(element.getBoundingClientRect().height).toBeCloseTo(300, 0);
        element.remove();
    });

    it("waits a frame before measuring, so a child that lays out late is not undershot", async () => {
        const { element, setContent } = host(100);
        const transition = new HeightTransition(element);

        transition.capture();
        setContent(40);
        // A custom element that finishes laying out after Lit reports the update as done.
        requestAnimationFrame(() => setContent(160));

        await transition.play();
        element.getAnimations()[0]?.finish();
        // Measured after the frame, so the target is the settled height rather than the 40
        // that was on screen when the render finished.
        expect(element.getBoundingClientRect().height).toBeCloseTo(160, 0);
        element.remove();
    });

    it("does not animate when the height did not actually change", async () => {
        const { element } = host(100);
        const transition = new HeightTransition(element);

        transition.capture();
        await transition.play();

        expect(element.getAnimations()).toHaveLength(0);
        expect(element.getBoundingClientRect().height).toBeCloseTo(100, 0);
        element.remove();
    });

    it("retargets from where a running animation had reached", async () => {
        const { element, setContent } = host(100);
        const transition = new HeightTransition(element);

        transition.capture();
        setContent(300);
        await transition.play();
        await new Promise((resolve) => setTimeout(resolve, 60));

        // Interrupt mid-flight: the second animation has to continue from the height on
        // screen, otherwise the pane snaps before starting the new leg.
        const interrupted = element.getBoundingClientRect().height;
        expect(interrupted).toBeGreaterThan(100);
        expect(interrupted).toBeLessThan(300);

        transition.capture();
        setContent(100);
        expect(element.getBoundingClientRect().height).toBeCloseTo(interrupted, -1);

        await transition.play();
        element.getAnimations()[0].finish();
        expect(element.getBoundingClientRect().height).toBeCloseTo(100, 0);
        element.remove();
    });

    it("abandons a pending measurement when a newer swap takes over", async () => {
        const { element, setContent } = host(100);
        const transition = new HeightTransition(element);

        transition.capture();
        setContent(300);
        const stale = transition.play();
        // A second swap before the first one measured.
        transition.capture();
        setContent(200);
        await stale;

        expect(element.getAnimations()).toHaveLength(0);
        await transition.play();
        element.getAnimations()[0].finish();
        expect(element.getBoundingClientRect().height).toBeCloseTo(200, 0);
        element.remove();
    });

    it("leaves no animation and no held height behind once cancelled", async () => {
        const { element, setContent } = host(100);
        const transition = new HeightTransition(element);

        transition.capture();
        setContent(300);
        await transition.play();
        transition.cancel();
        await frame();

        expect(element.getAnimations()).toHaveLength(0);
        expect(element.style.height).toBe("");
        expect(element.getBoundingClientRect().height).toBeCloseTo(300, 0);
        element.remove();
    });
});
