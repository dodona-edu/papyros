import { customElement } from "lit/decorators.js";
import { css, CSSResult, html, nothing, PropertyValues, TemplateResult } from "lit";
import { OutputEntry, OutputTab, OutputType, OUTPUT_TAB, TURTLE_TAB } from "../state/InputOutput";
import { PapyrosElement } from "./PapyrosElement";
import { paneLabelStyles, placeholderStyles, tabBarStyles, tabButtonStyles } from "./shared-styles";
import { nextTabIndex } from "./tabs";
import { TurtlePatch, TurtleSvgBuilder } from "../state/TurtleSvg";
import { HeightTransition } from "./motion";
import { outputStyles, renderEntry, renderOverflow, shownOutput } from "./output/renderOutput";
import { FollowEnd } from "./output/followEnd";

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

            .output-img {
                max-height: 300px;
                margin: 0.5rem 0;
            }

            img.turtle,
            .turtle-placeholder {
                max-width: 100cqw;
                max-height: 100cqh;
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

            ${placeholderStyles}

            .place-holder {
                white-space: pre-wrap;
            }

            ${tabButtonStyles}
            ${outputStyles}
        `;
    }

    /** The Turtle tab has a fixed height and the Text tab grows with its output, so the panel resizes into the new one. */
    private heightTransition = new HeightTransition(this);
    private renderedTab: OutputTab | undefined = undefined;

    /** Replays the turtle patches; kept across renders so following a run stays incremental. */
    private turtleSvg = new TurtleSvgBuilder();

    private followEnd = new FollowEnd(this, () => this.renderRoot.querySelector<HTMLElement>(".content"));

    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.heightTransition.cancel();
    }

    protected override willUpdate(changedProperties: PropertyValues): void {
        super.willUpdate(changedProperties);
        // A new run empties the output, and its output is followed from the start.
        if (this.papyros.io.output.length === 0) this.followEnd.restart();
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
        void this.heightTransition.play();
    }

    private get maxOutputLength(): number {
        if (this.papyros.debugger.active && this.papyros.debugger.debugOutputs !== undefined) {
            return this.papyros.debugger.debugOutputs;
        }

        return this.papyros.constants.maxOutputLength;
    }

    private turtleSvgSource: string | undefined = undefined;
    private turtleSvgUrl = "";

    private turtleUrl(svg: string): string {
        if (svg !== this.turtleSvgSource) {
            this.turtleSvgSource = svg;
            this.turtleSvgUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        }
        return this.turtleSvgUrl;
    }

    private renderOutputs(outputs: OutputEntry[]): TemplateResult[] {
        if (this.papyros.io.activeOutputTab === TURTLE_TAB) {
            // Replay every patch within outputs (which is sliced by the debugger's
            // current step via maxOutputLength) — so stepping the debugger shows the
            // drawing build up.
            const patches = outputs.filter((o) => o.type === OutputType.turtle).map((o) => o.content as TurtlePatch);
            const svg = this.turtleSvg.build(patches);
            return svg === undefined
                ? []
                : [html`<img class="turtle" src=${this.turtleUrl(svg)} alt=${this.t("Papyros.turtle_alt")} />`];
        }
        return outputs.filter((o) => o.type !== OutputType.turtle).map((o) => renderEntry(o, this.papyros));
    }

    private get showTurtleTab(): boolean {
        return this.papyros.io.hasTurtleOutput || this.papyros.io.activeOutputTab === TURTLE_TAB;
    }

    /** Standard ARIA tabs pattern: arrow keys move focus and select in one step. */
    private handleTabsKeydown(e: KeyboardEvent): void {
        const tabs = OUTPUT_TABS;
        const nextIndex = nextTabIndex(e.key, tabs.indexOf(this.papyros.io.activeOutputTab), tabs.length);
        if (nextIndex === undefined) return;
        e.preventDefault();
        const nextTab = tabs[nextIndex];
        this.papyros.io.selectOutputTab(nextTab);
        void this.updateComplete.then(() => {
            this.renderRoot.querySelector<HTMLElement>(`#tab-${nextTab}`)?.focus();
        });
    }

    private renderTab(tab: OutputTab): TemplateResult {
        const active = this.papyros.io.activeOutputTab === tab;
        return html`
            <button
                id="tab-${tab}"
                role="tab"
                aria-selected=${active}
                aria-controls="output-panel"
                tabindex=${active ? 0 : -1}
                class=${active ? "active" : ""}
                @click=${() => this.papyros.io.selectOutputTab(tab)}
            >
                ${tab === TURTLE_TAB ? this.t("Papyros.output_tab_turtle") : this.t("Papyros.output_tab_text")}
            </button>
        `;
    }

    private renderTabs(): TemplateResult {
        return html`
            <div
                class="tablist"
                role="tablist"
                aria-label=${this.t("Papyros.output_tabs")}
                @keydown=${this.handleTabsKeydown}
            >
                ${OUTPUT_TABS.map((tab) => this.renderTab(tab))}
            </div>
        `;
    }

    protected override render(): TemplateResult {
        const activeTab = this.papyros.io.activeOutputTab;
        const { shown, truncated } = shownOutput(this.papyros.io.output, this.maxOutputLength);
        const rendered = this.renderOutputs(shown);
        const showPlaceholder = activeTab === OUTPUT_TAB && rendered.length === 0;
        const showTurtlePlaceholder = activeTab === TURTLE_TAB && rendered.length === 0;
        const showOverflow = activeTab === OUTPUT_TAB && truncated && !this.papyros.debugger.active;
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
                @scroll=${this.followEnd.onScroll}
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
                ${showOverflow ? renderOverflow(this.papyros, this.maxOutputLength) : html``}
            </div>
        `;
    }
}
