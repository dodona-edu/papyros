import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("p-resize")
export class Resize extends LitElement {
    @property({ type: Boolean, reflect: true })
    column = false;

    @property({ type: Number })
    percentage = 50;

    private dragRect?: DOMRect;

    static styles = css`
        :host {
            display: flex;
            flex-direction: row;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }

        :host([column]) {
            flex-direction: column;
        }

        .pane {
            display: flex;
            min-width: 0;
            min-height: 0;
        }

        .pane.first {
            flex: 0 0 var(--p-resize-first, 50%);
        }

        .pane.second {
            flex: 1 1 0;
        }

        .handle {
            flex: 0 0 var(--p-drag-handle-size, 1rem);
            background: var(--p-drag-handle-color, var(--md-sys-color-background));
            cursor: col-resize;
            touch-action: none;
        }

        :host([column]) .handle {
            cursor: row-resize;
        }
    `;

    protected override willUpdate(): void {
        this.style.setProperty("--p-resize-first", `${this.percentage}%`);
    }

    private startDrag = (e: PointerEvent): void => {
        const handle = e.currentTarget as HTMLElement;
        handle.setPointerCapture(e.pointerId);
        this.dragRect = this.getBoundingClientRect();
        handle.addEventListener("pointermove", this.onPointerMove);
        handle.addEventListener("pointerup", this.endDrag, { once: true });
        handle.addEventListener("pointercancel", this.endDrag, { once: true });
    };

    private onPointerMove = (e: PointerEvent): void => {
        const rect = this.dragRect;
        if (!rect) return;
        const ratio = this.column ? (e.clientY - rect.top) / rect.height : (e.clientX - rect.left) / rect.width;
        this.percentage = Math.min(100, Math.max(0, ratio * 100));
    };

    private endDrag = (e: PointerEvent): void => {
        const handle = e.currentTarget as HTMLElement;
        handle.removeEventListener("pointermove", this.onPointerMove);
        this.dragRect = undefined;
    };

    private onKeyDown = (e: KeyboardEvent): void => {
        const decrease = this.column ? "ArrowUp" : "ArrowLeft";
        const increase = this.column ? "ArrowDown" : "ArrowRight";
        if (e.key === decrease) {
            this.percentage = Math.max(0, this.percentage - 5);
            e.preventDefault();
        } else if (e.key === increase) {
            this.percentage = Math.min(100, this.percentage + 5);
            e.preventDefault();
        }
    };

    protected override render(): TemplateResult {
        return html`
            <div class="pane first">
                <slot name="first"></slot>
            </div>
            <div
                class="handle"
                role="separator"
                aria-orientation=${this.column ? "horizontal" : "vertical"}
                aria-valuenow=${Math.round(this.percentage)}
                tabindex="0"
                @pointerdown=${this.startDrag}
                @keydown=${this.onKeyDown}
            ></div>
            <div class="pane second">
                <slot name="second"></slot>
            </div>
        `;
    }
}
