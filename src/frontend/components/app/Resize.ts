import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("p-resize")
export class Resize extends LitElement {
    @property({ type: Boolean })
        column: boolean = false;
    @property({ type: Number })
        percentage: number = 50;
    @property({ type: Number })
        breakpoint: number = 0; // px
    @property({ state: true })
        dragging: boolean = false;
    @property({ state: true })
        screenwidth: number = window.innerWidth;

    static styles = css`
        :host {
            display: flex;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        .flex {
            display: flex;
        }
        .handler {
            min-height: var(--p-drag-handle-size, 1rem);
            min-width: var(--p-drag-handle-size, 1rem);
            background: var(--p-drag-handle-color, var(--md-sys-color-background));
        }
    `;

    get isColumn(): boolean {
        return this.screenwidth < this.breakpoint || this.column;
    }

    private resize(e: MouseEvent): void {
        if(this.isColumn) {
            const totalHeight = this.clientHeight;
            const newHeight = e.clientY - this.getBoundingClientRect().top;
            this.percentage = (newHeight / totalHeight) * 100;
        } else {
            const totalWidth = this.clientWidth;
            const newWidth = e.clientX - this.getBoundingClientRect().left;
            this.percentage = (newWidth / totalWidth) * 100;
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        if(this.dragging) {
            this.resize(e);
        }
    }

    private handleMouseUp(): void {
        this.dragging = false;
    }

    private handleScreenResize(): void {
        this.screenwidth = window.innerWidth;
    }

    public override connectedCallback(): void {
        super.connectedCallback();
        document.addEventListener("mousemove", this.handleMouseMove.bind(this));
        document.addEventListener("mouseup", this.handleMouseUp.bind(this));
        window.addEventListener("resize", this.handleScreenResize.bind(this));
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener("mousemove", this.handleMouseMove.bind(this));
        document.removeEventListener("mouseup", this.handleMouseUp.bind(this));
        window.removeEventListener("resize", this.handleScreenResize.bind(this));
    }

    get secondSize(): string {
        return `calc(${100 - this.percentage}% - var(--p-drag-handle-size, 1rem))`;
    }

    protected override render(): TemplateResult {
        return html`
            <style>
                :host {
                    flex-direction: ${this.isColumn ? "column" : "row"};
                }
                
                .handler {
                    cursor: ${this.isColumn ? "row-resize" : "col-resize"};
                    ${this.isColumn ? "width: 100%;" : "height: 100%;"}
                }
            </style>
            <div class="flex" style="${this.isColumn ? `height: ${this.percentage}%;` : `width: ${this.percentage}%;`}">
                <slot name="first"></slot>
            </div>
            <div class="handler" @mousedown=${() => this.dragging = true}></div>
            <div class="flex" style="${this.isColumn ? `height: ${this.secondSize};` : `width: ${this.secondSize};`}">
                <slot name="second"></slot>
            </div>
        `;
    }
}