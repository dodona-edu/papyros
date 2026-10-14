import { customElement } from "lit/decorators.js";
import { css, CSSResult, html, nothing, PropertyValues, TemplateResult } from "lit";
import { FriendlyError, OutputEntry, OutputTab, OutputType, OUTPUT_TAB, TURTLE_TAB } from "../state/InputOutput";
import { PapyrosElement } from "./PapyrosElement";
import { paneLabelStyles, tabBarStyles, tabButtonStyles } from "./shared-styles";
import { TurtlePatch, TurtleSvgBuilder } from "../state/TurtleSvg";
import { HeightTransition } from "./motion";
import "@material/web/icon/icon";

const OUTPUT_TABS: OutputTab[] = [OUTPUT_TAB, TURTLE_TAB];

@customElement("p-output")
export class Output extends PapyrosElement {
    static get styles(): CSSResult {
        return css`
            /* The panel takes the height of its output, up to a maximum that the host can set. */
            :host {
                width: 100%;
                max-height: var(--papyros-output-max-height, 10rem);
                min-height: 0;
                display: flex;
                flex-direction: column;
                border: 1px solid var(--md-sys-color-outline-variant);
                border-radius: 0.625rem;
                background-color: var(--md-sys-color-surface);
                overflow: hidden;
                box-sizing: border-box;
            }

            /* A drawing needs a fixed height to scale into, whatever it holds. */
            :host([active-tab="turtle"]) {
                height: var(--papyros-output-turtle-height, 23.75rem);
                max-height: none;
            }

            ${tabBarStyles}
            ${paneLabelStyles}

            .content {
                flex: 1 1 auto;
                min-height: 0;
                overflow: auto;
                /* Scroll anchoring would move the view away from the end that it follows. */
                overflow-anchor: none;
                padding: 0.5rem 0.875rem;
                background-color: var(--md-sys-color-surface-container-highest);
            }

            .content:focus-visible {
                outline: 2px solid var(--md-sys-color-primary);
                outline-offset: -2px;
            }

            .content.turtle {
                container-type: size;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem;
            }

            img {
                max-width: 100%;
                max-height: 300px;
                display: block;
                margin: 0.5rem 0;
            }

            img.turtle,
            .turtle-placeholder {
                max-width: 100cqw;
                max-height: 100cqh;
                margin: 0;
                box-sizing: border-box;
                background-color: var(--md-sys-color-surface);
                border: 1px solid var(--md-sys-color-outline-variant);
            }

            .turtle-placeholder {
                width: 400px;
                height: 400px;
            }

            pre {
                font-family: monospace;
                font-size: 0.875rem;
                line-height: 1.4;
                margin: 0;
            }

            .error {
                color: var(--md-sys-color-error);
            }

            .place-holder {
                white-space: pre-wrap;
                color: var(--md-sys-color-on-surface-variant);
            }

            .visually-hidden {
                position: absolute;
                width: 1px;
                height: 1px;
                overflow: hidden;
                clip: rect(0 0 0 0);
                white-space: nowrap;
            }

            md-icon {
                vertical-align: bottom;
            }

            ${tabButtonStyles}
        `;
    }

    /** The Turtle tab has a fixed height and the Text tab grows with its output, so the panel resizes into the new one. */
    private heightTransition = new HeightTransition(this);
    private renderedTab: OutputTab | undefined = undefined;

    /** Replays the turtle patches; kept across renders so following a run stays incremental. */
    private turtleSvg = new TurtleSvgBuilder();

    /** Whether the reader is at the end of the output, so new output keeps the end in view. */
    private following = true;

    /** A scroll position this element set itself, so the scroll event it causes is not taken for the reader's. */
    private ownScrollTop: number | undefined = undefined;

    /** An image gets its height after the render that inserts it, which moves the end of the output. */
    private resizeObserver = new ResizeObserver(() => this.scrollToEndIfFollowing());

    private get content(): HTMLElement | null {
        return this.renderRoot.querySelector<HTMLElement>(".content");
    }

    private onScroll = (): void => {
        const content = this.content;
        if (!content) return;
        if (content.scrollTop === this.ownScrollTop) {
            this.ownScrollTop = undefined;
            return;
        }
        this.following = content.scrollHeight - content.scrollTop - content.clientHeight <= 1;
    };

    private scrollToEndIfFollowing(): void {
        const content = this.content;
        if (!content) return;
        // Output that fits has no end to scroll away from, so the next output is followed again.
        if (content.scrollHeight <= content.clientHeight) this.following = true;
        if (!this.following) return;
        const before = content.scrollTop;
        content.scrollTop = content.scrollHeight;
        if (content.scrollTop !== before) {
            this.ownScrollTop = content.scrollTop;
        }
    }

    private observeContent(): void {
        const content = this.content;
        this.resizeObserver.disconnect();
        if (!content) return;
        this.resizeObserver.observe(content);
        for (const child of Array.from(content.children)) {
            this.resizeObserver.observe(child);
        }
    }

    public override connectedCallback(): void {
        super.connectedCallback();
        this.observeContent();
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.resizeObserver.disconnect();
        this.heightTransition.cancel();
    }

    protected override willUpdate(changedProperties: PropertyValues): void {
        super.willUpdate(changedProperties);
        // A new run empties the output, and its output is followed from the start.
        if (this.papyros.io.output.length === 0) this.following = true;
        // Only the tab swap changes the height on its own; new output grows the panel line by line.
        const tab = this.papyros.io.activeOutputTab;
        if (this.renderedTab !== undefined && this.renderedTab !== tab) {
            this.heightTransition.capture();
        }
        this.renderedTab = tab;
    }

    /** Reflects the active tab on the host, so the turtle height applies to the whole panel. */
    protected override update(changedProperties: PropertyValues): void {
        this.setAttribute("active-tab", this.papyros.io.activeOutputTab);
        super.update(changedProperties);
    }

    protected override updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        this.observeContent();
        this.scrollToEndIfFollowing();
        void this.heightTransition.play();
    }

    private get maxOutputLength(): number {
        if (this.papyros.debugger.active && this.papyros.debugger.debugOutputs !== undefined) {
            return this.papyros.debugger.debugOutputs;
        }

        return this.papyros.constants.maxOutputLength;
    }

    get outputs(): OutputEntry[] {
        return this.papyros.io.output.slice(0, this.maxOutputLength);
    }

    get overflow(): OutputEntry[] {
        return this.papyros.io.output.slice(this.maxOutputLength);
    }

    get showOverflowWarning(): boolean {
        return !this.papyros.debugger.active && this.papyros.io.output.length > this.maxOutputLength;
    }

    get downloadOverflowUrl(): string {
        const blob = new Blob(
            this.overflow.map((o) => {
                if (o.type === OutputType.img || o.type === OutputType.turtle) {
                    return `[Image output of type ${o.contentType} omitted]\n`;
                } else if (o.type === OutputType.stdout) {
                    return o.content as string;
                } else if (o.type === OutputType.stderr) {
                    if (typeof o.content === "string") {
                        return `Error: ${o.content}\n`;
                    } else {
                        const errorObject = o.content as FriendlyError;
                        let errorString = `Error: ${errorObject.name}\nInfo: ${errorObject.info}\nTraceback: ${errorObject.traceback}\n`;
                        if (errorObject.where) {
                            errorString += `Where: ${errorObject.where.trim()}\n`;
                        }
                        if (errorObject.what) {
                            errorString += `What: ${errorObject.what.trim()}\n`;
                        }
                        if (errorObject.why) {
                            errorString += `Why: ${errorObject.why.trim()}\n`;
                        }
                        return errorString;
                    }
                } else {
                    return "[Unsupported output type omitted]\n";
                }
            }),
            { type: "text/plain" },
        );

        return URL.createObjectURL(blob);
    }

    get renderedOutputs(): TemplateResult[] {
        if (this.papyros.io.activeOutputTab === TURTLE_TAB) {
            // Replay every patch within this.outputs (which is sliced by the debugger's
            // current step via maxOutputLength) — so stepping the debugger shows the
            // drawing build up.
            const patches = this.outputs
                .filter((o) => o.type === OutputType.turtle)
                .map((o) => o.content as TurtlePatch);
            const svg = this.turtleSvg.build(patches);
            return svg === undefined
                ? []
                : [
                      html`<img
                          class="turtle"
                          src="data:image/svg+xml,${encodeURIComponent(svg)}"
                          alt=${this.t("Papyros.turtle_alt")}
                      />`,
                  ];
        }
        const outputsToRender: OutputEntry[] = this.outputs.filter((o) => o.type !== OutputType.turtle);
        return outputsToRender.map((o) => {
            if (o.type === OutputType.stdout) {
                return html`${o.content}`;
            } else if (o.type === OutputType.img) {
                const mimeType = o.contentType ?? "image/png";
                return html`<img src="data:${mimeType},${o.content as string}" alt=${this.t("Papyros.image_alt")} />`;
            } else if (o.type === OutputType.stderr) {
                if (typeof o.content === "string") {
                    return html`<span class="error"
                        ><span class="visually-hidden">${this.t("Papyros.error_prefix")}</span>${o.content}</span
                    >`;
                } else {
                    const errorObject = o.content as FriendlyError;
                    const errorHTML = [
                        // an array to avoid unintentional spaces/newlines
                        html`<md-icon title="${errorObject.info}" aria-label="${errorObject.info}" role="img"
                                >${this.papyros.constants.icons.help}</md-icon
                            >${errorObject.name} traceback:`,
                        "\n",
                        html`<md-icon title="${errorObject.traceback}" aria-label="${errorObject.traceback}" role="img"
                            >${this.papyros.constants.icons.info}</md-icon
                        >`,
                        html`<span class="where">${errorObject.where?.trim()}</span>`,
                    ];
                    if (errorObject.what) {
                        errorHTML.push("\n", html`<span class="what">${errorObject.what.trim()}</span>`);
                    }
                    if (errorObject.why) {
                        errorHTML.push("\n", html`<span class="why">${errorObject.why.trim()}</span>`);
                    }
                    return html`<span class="error">${errorHTML}</span>`;
                }
            } else {
                return html``; // unsupported output type
            }
        });
    }

    private get showTurtleTab(): boolean {
        return this.papyros.io.hasTurtleOutput || this.papyros.io.activeOutputTab === TURTLE_TAB;
    }

    /** Standard ARIA tabs pattern: arrow keys move focus and select in one step. */
    private handleTabsKeydown(e: KeyboardEvent): void {
        const tabs = OUTPUT_TABS;
        const currentIndex = tabs.indexOf(this.papyros.io.activeOutputTab);
        let nextIndex: number;
        switch (e.key) {
            case "ArrowLeft":
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                break;
            case "ArrowRight":
                nextIndex = (currentIndex + 1) % tabs.length;
                break;
            case "Home":
                nextIndex = 0;
                break;
            case "End":
                nextIndex = tabs.length - 1;
                break;
            default:
                return;
        }
        e.preventDefault();
        const nextTab = tabs[nextIndex];
        this.papyros.io.selectOutputTab(nextTab);
        void this.updateComplete.then(() => {
            this.renderRoot.querySelector<HTMLElement>(`#tab-${nextTab}`)?.focus();
        });
    }

    private renderTabs(): TemplateResult {
        const activeTab = this.papyros.io.activeOutputTab;
        return html`
            <div
                class="tablist"
                role="tablist"
                aria-label=${this.t("Papyros.output_tabs")}
                @keydown=${this.handleTabsKeydown}
            >
                <button
                    id="tab-output"
                    role="tab"
                    aria-selected=${activeTab === OUTPUT_TAB}
                    aria-controls="output-panel"
                    tabindex=${activeTab === OUTPUT_TAB ? 0 : -1}
                    class=${activeTab === OUTPUT_TAB ? "active" : ""}
                    @click=${() => this.papyros.io.selectOutputTab(OUTPUT_TAB)}
                >
                    ${this.t("Papyros.output_tab_text")}
                </button>
                <button
                    id="tab-turtle"
                    role="tab"
                    aria-selected=${activeTab === TURTLE_TAB}
                    aria-controls="output-panel"
                    tabindex=${activeTab === TURTLE_TAB ? 0 : -1}
                    class=${activeTab === TURTLE_TAB ? "active" : ""}
                    @click=${() => this.papyros.io.selectOutputTab(TURTLE_TAB)}
                >
                    ${this.t("Papyros.output_tab_turtle")}
                </button>
            </div>
        `;
    }

    protected override render(): TemplateResult {
        const activeTab = this.papyros.io.activeOutputTab;
        const rendered = this.renderedOutputs;
        const showPlaceholder = activeTab === OUTPUT_TAB && rendered.length === 0;
        const showTurtlePlaceholder = activeTab === TURTLE_TAB && rendered.length === 0;
        const showOverflow = activeTab === OUTPUT_TAB && this.showOverflowWarning;
        const showTabs = this.showTurtleTab;
        const placeholder = this.papyros.debugger.active
            ? this.t("Papyros.debug_output_placeholder")
            : this.t("Papyros.output_placeholder");
        return html`
            <div class="tab-bar">
                <span class="pane-label" id="output-title">${this.t("Papyros.output")}</span>
                <!-- A tablist may only contain tabs, so the pane label sits outside it. -->
                ${showTabs ? this.renderTabs() : nothing}
            </div>
            <div
                class="content ${activeTab === TURTLE_TAB ? "turtle" : ""}"
                id="output-panel"
                role=${showTabs ? "tabpanel" : "region"}
                aria-labelledby=${showTabs ? `tab-${activeTab}` : "output-title"}
                tabindex="0"
                @scroll=${this.onScroll}
            >
                ${
                    activeTab === OUTPUT_TAB
                        ? html`
                              ${showPlaceholder ? html`<pre class="place-holder">${placeholder}</pre>` : nothing}
                              <!-- Screen readers only announce changes to a live region that is already in the page. -->
                              <pre role="log" aria-live="polite" aria-relevant="additions text">${rendered}</pre>
                          `
                        : showTurtlePlaceholder
                          ? html`<div class="turtle-placeholder"></div>`
                          : rendered
                }
                ${
                    showOverflow
                        ? html`
                              <p>
                                  ${this.t("Papyros.output_overflow")}
                                  <a href="${this.downloadOverflowUrl}" download="papyros_output.txt">
                                      ${this.t("Papyros.output_overflow_download")}
                                  </a>
                              </p>
                          `
                        : html``
                }
            </div>
        `;
    }
}
