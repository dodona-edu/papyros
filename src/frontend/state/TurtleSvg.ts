/**
 * The turtle drawing arrives from the worker as incremental patches instead of
 * a full SVG document per snapshot: the worker renders every canvas item once
 * and only sends the ones that changed (see papyros/turtle_svg.py). Replaying
 * the patches of a run reproduces exactly the document svg-turtle would have
 * produced at that point.
 *
 * Debugging streams one snapshot per frame, so this is what keeps a turtle
 * debug session linear rather than quadratic in the size of the drawing.
 */
export interface TurtlePatch {
    /** Drop everything received so far; the canvas was reset. */
    clear?: boolean;
    /** Document around the fragments. Sent when the canvas size or background changes. */
    open?: string;
    close?: string;
    /** Canvas width and height in pixels, sent along with `open`. */
    size?: [number, number];
    /** Fragments for the canvas items that changed, as [item index, svg]. */
    set?: [number, string][];
    /** All item indices in painting order, sent only when that order changed. */
    order?: number[];
}

/**
 * Replays turtle patches into an SVG document.
 *
 * Successive builds over a growing list of patches only apply the new ones, so
 * following a run costs no more than a single replay in total. Handing it a
 * list that is not an extension of the previous one (scrubbing the debugger
 * backwards, or a new run) transparently replays from the start.
 */
export class TurtleSvgBuilder {
    private fragments: string[] = [];
    private order: number[] | undefined = undefined;
    private open: string = "";
    private close: string = "";
    private applied: number = 0;
    private lastApplied: TurtlePatch | undefined = undefined;
    /** The document of the applied patches, until the next patch changes it */
    private svg: string | undefined = undefined;
    private canvasSize: [number, number] | undefined = undefined;

    /** Width and height of the canvas, once a patch has sent them */
    public get size(): [number, number] | undefined {
        return this.canvasSize;
    }

    public build(patches: TurtlePatch[]): string | undefined {
        if (!this.canExtend(patches)) {
            this.reset();
        }
        if (this.applied === patches.length) {
            return this.svg;
        }
        for (let i = this.applied; i < patches.length; i++) {
            this.apply(patches[i]);
        }
        this.applied = patches.length;
        this.lastApplied = patches[patches.length - 1];

        if (!this.open) {
            this.svg = undefined;
        } else {
            const order = this.order ?? this.fragments.map((_, i) => i);
            this.svg = this.open + order.map((i) => this.fragments[i] ?? "").join("") + this.close;
        }
        return this.svg;
    }

    /** The canvas of the last build, background included, with nothing drawn on it */
    public blank(): string | undefined {
        return this.open ? this.open + this.close : undefined;
    }

    private canExtend(patches: TurtlePatch[]): boolean {
        return this.applied <= patches.length && (this.applied === 0 || patches[this.applied - 1] === this.lastApplied);
    }

    private reset(): void {
        this.fragments = [];
        this.order = undefined;
        this.open = "";
        this.close = "";
        this.applied = 0;
        this.lastApplied = undefined;
        this.svg = undefined;
        this.canvasSize = undefined;
    }

    private apply(patch: TurtlePatch): void {
        if (patch.clear) {
            this.fragments = [];
            this.order = undefined;
        }
        if (patch.open !== undefined) {
            this.open = patch.open;
            this.close = patch.close ?? "";
            this.canvasSize = patch.size;
        }
        for (const [index, fragment] of patch.set ?? []) {
            this.fragments[index] = fragment;
        }
        if (patch.order !== undefined) {
            this.order = patch.order;
        }
    }
}

/**
 * One-shot replay, for callers that do not follow a run incrementally.
 */
export function buildTurtleSvg(patches: TurtlePatch[]): string | undefined {
    return new TurtleSvgBuilder().build(patches);
}
