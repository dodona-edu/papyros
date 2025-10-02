import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("p-resize")
export class Resize extends LitElement {
    @property({ type: Boolean })
        column: boolean = false;
    @property({ type: Number })
        percentage: number = 50;
    @property({ state: true })
        dragging: boolean = false;

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
            background: var(--md-sys-color-background);
        }
    `;

    private resize(e: MouseEvent): void {
        if(this.column) {
            const totalHeight = this.clientHeight;
            const newHeight = e.clientY - this.getBoundingClientRect().top;
            this.percentage = (newHeight / totalHeight) * 100;
        } else {
            const totalWidth = this.clientWidth;
            const newWidth = e.clientX - this.getBoundingClientRect().left;
            this.percentage = (newWidth / totalWidth) * 100;
        }
    }

    public override connectedCallback(): void {
        super.connectedCallback();
        document.addEventListener("mousemove", (e: MouseEvent) => {
            if(this.dragging) {
                this.resize(e);
            }
        });
        document.addEventListener("mouseup", () => {
            this.dragging = false;
        });
    }

    get secondSize(): string {
        return `calc(${100 - this.percentage}% - var(--p-drag-handle-size, 1rem))`;
    }

    protected override render(): TemplateResult {
        return html`
            <style>
                :host {
                    flex-direction: ${this.column ? "column" : "row"};
                }
                
                .handler {
                    cursor: ${this.column ? "row-resize" : "col-resize"};
                    ${this.column ? "width: 100%;" : "height: 100%;"}
                }
            </style>
            <div class="flex" style="${this.column ? `height: ${this.percentage}%;` : `width: ${this.percentage}%;`}">
                <slot name="first"></slot>
            </div>
            <div class="handler" @mousedown=${() => this.dragging = true}></div>
            <div class="flex" style="${this.column ? `height: ${this.secondSize};` : `width: ${this.secondSize};`}">
                <slot name="second"></slot>
            </div>
        `;
    }
}