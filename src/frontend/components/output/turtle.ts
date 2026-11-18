import { css, html, TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { TurtlePatch, TurtleSvgBuilder } from "../../state/TurtleSvg";

/** A turtle canvas as an image, with the canvas size in pixels */
export interface TurtleImage {
    url: string;
    width: number;
    height: number;
}

/** The canvas size of Python's turtle */
const DEFAULT_SIZE: [number, number] = [400, 400];

/**
 * Follows the turtle drawing of a run. A growing list of patches only applies the new ones,
 * and a drawing that did not change keeps its image.
 */
export class TurtleDrawing {
    private readonly builder = new TurtleSvgBuilder();
    private svg: string | undefined = undefined;
    private image: TurtleImage | undefined = undefined;

    /** The drawing of the patches, or undefined before the first canvas */
    public update(patches: TurtlePatch[]): TurtleImage | undefined {
        const svg = this.builder.build(patches);
        if (svg !== this.svg) {
            this.svg = svg;
            this.image = svg === undefined ? undefined : this.toImage(svg);
        }
        return this.image;
    }

    /** The canvas of the last update with nothing drawn on it */
    public blank(): TurtleImage | undefined {
        const svg = this.builder.blank();
        return svg === undefined ? undefined : this.toImage(svg);
    }

    private toImage(svg: string): TurtleImage {
        const [width, height] = this.builder.size ?? DEFAULT_SIZE;
        return { url: `data:image/svg+xml,${encodeURIComponent(svg)}`, width, height };
    }
}

/**
 * The canvas size is passed as --turtle-width and --turtle-height, unitless, for the host to
 * size the image before it decodes.
 */
export function renderTurtleImage(image: TurtleImage, alt: string): TemplateResult {
    return html`<img
        class="turtle"
        src=${image.url}
        alt=${alt}
        style=${styleMap({ "--turtle-width": String(image.width), "--turtle-height": String(image.height) })}
    />`;
}

export const turtleStyles = css`
    img.turtle {
        box-sizing: border-box;
        border: 1px solid var(--md-sys-color-outline-variant);
    }
`;
