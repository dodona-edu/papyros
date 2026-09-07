/**
 * Motion that answers something the user just did. Everything here is a no-op for
 * people who ask for reduced motion, so the change still happens, just instantly.
 */
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

export function prefersReducedMotion(): boolean {
    return reducedMotion.matches;
}

/**
 * Animates an element between the height it had before a render and the one it has
 * after, so swapping its contents resizes the surrounding layout smoothly instead of
 * jumping. Height is a layout property, so neighbours in the same flex column follow
 * along on their own.
 *
 * `interpolate-size` would express this in CSS alone, but it is Chromium-only, and
 * measuring works everywhere.
 */
export class HeightTransition {
    private from: number | undefined;
    private animation: Animation | undefined;
    /** Identifies the swap in flight, so a newer one abandons the pending measurement. */
    private generation = 0;

    constructor(
        private readonly host: HTMLElement,
        private readonly duration: number = 200,
    ) {}

    /** Call before the DOM changes, to record the height to grow or shrink from. */
    public capture(): void {
        if (prefersReducedMotion()) return;
        this.generation++;
        // Read before cancelling: a running animation reports the height it has reached,
        // which is where a retargeted one should continue from.
        this.from = this.host.getBoundingClientRect().height;
        this.animation?.cancel();
        this.animation = undefined;
        // Hold that height while the new content renders, so nothing is ever painted at
        // a size that is about to change.
        this.host.style.height = `${this.from}px`;
    }

    /** Call once the DOM has changed, to animate to the new natural height. */
    public async play(): Promise<void> {
        const from = this.from;
        const generation = this.generation;
        this.from = undefined;
        if (from === undefined) return;

        // A custom element inside (an md-* text field, say) lays out a frame after its own
        // render, so its host is still growing when Lit reports the update as done. Measuring
        // now would aim the animation below the resting height and snap back at the end.
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (generation !== this.generation) return;

        this.host.style.height = "";
        const to = this.host.getBoundingClientRect().height;
        if (Math.abs(to - from) < 1) return;

        this.animation = this.host.animate([{ height: `${from}px` }, { height: `${to}px` }], {
            duration: this.duration,
            easing: "ease-out",
        });
    }

    public cancel(): void {
        this.generation++;
        this.animation?.cancel();
        this.animation = undefined;
        this.from = undefined;
        this.host.style.height = "";
    }
}

/** Fades an element in, for content that replaces other content in a box of the same size. */
export function fadeIn(element: HTMLElement, duration: number = 200): void {
    if (prefersReducedMotion()) return;
    element.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: "ease-out" });
}
