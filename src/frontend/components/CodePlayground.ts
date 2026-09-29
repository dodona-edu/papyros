import { customElement, property, state } from "lit/decorators.js";
import { css, CSSResult, html, nothing, PropertyValues, TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { PapyrosElement } from "./PapyrosElement";
import { OutputEntry, OutputType } from "../state/InputOutput";
import { PapyrosLaunchError } from "../state/PapyrosErrors";
import type { PapyrosRuntime } from "../state/PapyrosRuntime";
import { RunMode } from "../../backend/Backend";
import { preloadWhenVisible, stopPreloading } from "./playground/preload";
import { visuallyHiddenStyles } from "./shared-styles";
import "@material/web/progress/circular-progress";
import "./code_runner/Code";
import "./FriendlyError";

/**
 * Mirrors the .output-body min-height below: reservations at or below this floor are a no-op
 */
const OUTPUT_BODY_MIN_HEIGHT = 22;

// Scroll positions can be fractional on high-DPI screens, so "at the bottom" allows a
// small remainder.
const SCROLL_BOTTOM_TOLERANCE = 2;

/**
 * An inline, runnable Python code block with its own output and input.
 *
 * Give every playground its own Papyros instance. Instances that share a PapyrosRuntime
 * boot Python once and take turns running: while one runs, the others offer no Run.
 *
 * @element p-code-playground
 */
@customElement("p-code-playground")
export class CodePlayground extends PapyrosElement {
    static get styles(): CSSResult {
        return css`
            :host {
                display: block;
                margin: 24px 0;
                color: var(--md-sys-color-on-surface);
            }

            .card {
                display: flex;
                flex-direction: column;
                overflow: hidden;
                font-size: 16px;
                background: var(--md-sys-color-surface);
                border: 1px solid var(--md-sys-color-outline-variant);
                border-radius: 12px;
                box-shadow:
                    0 2px 4px -1px rgb(0, 0, 0, 0.14),
                    0 4px 5px 0 rgb(0, 0, 0, 0.098),
                    0 1px 10px 0 rgb(0, 0, 0, 0.084);
            }

            .toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 10px 12px 10px 16px;
                background: var(--md-sys-color-primary-container);
                border-bottom: 1px solid var(--md-sys-color-outline-variant);
                color: var(--md-sys-color-on-primary-container);
            }

            .title {
                min-width: 0;
                font-size: 16px;
                font-weight: 500;
                overflow-wrap: break-word;
            }

            .actions {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: auto;
            }

            .text-button,
            .pill {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                height: 36px;
                border: 0;
                border-radius: 20px;
                font-family: inherit;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
            }

            .text-button {
                padding: 0 14px;
                background: none;
                color: var(--md-sys-color-primary);
                transition: background 145ms cubic-bezier(0.4, 0, 0.2, 1);
            }

            .text-button:hover:not(:disabled) {
                background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
            }

            .pill {
                padding: 0 18px;
                background: var(--md-sys-color-primary);
                color: var(--md-sys-color-on-primary);
                transition: box-shadow 145ms cubic-bezier(0.4, 0, 0.2, 1);
            }

            .pill:hover:not(:disabled, [aria-disabled="true"]) {
                box-shadow:
                    0 2px 4px -1px rgb(0, 0, 0, 0.14),
                    0 4px 5px 0 rgb(0, 0, 0, 0.098),
                    0 1px 10px 0 rgb(0, 0, 0, 0.084);
            }

            /* aria-disabled buttons stay focusable so screen readers can reach their reason
               text, so they need the disabled look without the disabled attribute. */
            button:disabled,
            button[aria-disabled="true"] {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .icon {
                display: inline-flex;
                flex: none;
            }

            .icon svg {
                width: 18px;
                height: 18px;
            }

            p-code {
                display: block;
                height: auto;
                min-height: 40px;
            }

            .input-row,
            .output,
            .error {
                padding: 14px 16px;
                border-top: 1px solid var(--md-sys-color-outline-variant);
                font-size: 14px;
                line-height: 22px;
            }

            /* Not on .output itself: its panel label keeps the page's font */
            .input-row,
            .output-body,
            .error {
                font-family: sfmono-regular, menlo, monaco, consolas, "Liberation Mono", "Courier New", monospace;
            }

            .input-row {
                display: flex;
                align-items: baseline;
                gap: 8px;
                background: var(--md-sys-color-surface);
            }

            .prompt {
                white-space: pre-wrap;
                color: var(--md-sys-color-on-surface);
            }

            .input-row input {
                flex: 1;
                font: inherit;
                border: 0;
                border-bottom: 1px solid var(--md-sys-color-outline-variant);
                background: transparent;
                color: inherit;
                padding: 2px 0;
            }

            .input-row input:focus {
                outline: none;
                border-bottom-color: var(--md-sys-color-primary);
            }

            .input-row input::placeholder {
                color: var(--md-sys-color-on-surface-variant);
            }

            .panel-label {
                margin-bottom: 6px;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--md-sys-color-on-surface);
            }

            .output {
                max-height: 300px;
                overflow: auto;
                background: var(--md-sys-color-surface-container-high);
                color: var(--md-sys-color-on-surface);
            }

            .output-body {
                min-height: 22px;
                transition: min-height 145ms cubic-bezier(0.4, 0, 0.2, 1);
            }

            .transcript {
                margin: 0;
                padding: 0;
                white-space: pre-wrap;
                word-break: normal;
                overflow-wrap: break-word;
                font: inherit;
            }

            .output-img {
                display: block;
                max-width: 100%;
            }

            .error {
                background: var(--md-sys-color-error-container);
                color: var(--md-sys-color-on-error-container);
            }

            .error-title {
                font-weight: 700;
                white-space: pre-wrap;
                overflow-wrap: break-word;
            }

            .status-line {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--md-sys-color-on-surface);
            }

            md-circular-progress {
                --md-circular-progress-size: 14px;
                flex-shrink: 0;
            }

            @media (prefers-reduced-motion: reduce) {
                .output-body {
                    transition: none;
                }
            }

            .config-error {
                padding: 14px 16px;
                background: var(--md-sys-color-error-container);
                border: 1px solid var(--md-sys-color-outline-variant);
                border-radius: 12px;
                color: var(--md-sys-color-on-error-container);
            }

            .config-error-title {
                font-weight: 700;
            }

            ${visuallyHiddenStyles}
        `;
    }

    /**
     * The code the playground starts with, and that Reset restores
     */
    @property({ attribute: false })
    code = "";

    /**
     * Language of the block; only Python runs
     */
    @property({ type: String, attribute: "programming-language" })
    programmingLanguage = "python";

    /**
     * Overrides the card title; an empty string hides it
     */
    @property({ type: String })
    label?: string;

    @state()
    private preparing = false;

    @state()
    private launchFailed = false;

    @state()
    private reservedHeight = 0;

    private wasAwaitingInput = false;
    private wasActive = false;
    private restoreFocus = false;
    private scrollToTop = false;
    private followOutput = false;
    private preloadRuntime: PapyrosRuntime | undefined;

    // Keyed on `outputs` array identity: papyros hands out a fresh array on every change
    // and never mutates it in place.
    private panelsCache?: {
        source: OutputEntry[];
        outputBlocks: (TemplateResult | typeof nothing)[];
        errors: OutputEntry[];
    };

    /**
     * The output of the latest run of this playground
     */
    get outputs(): OutputEntry[] {
        return this.papyros.io.output;
    }

    private get supported(): boolean {
        return this.programmingLanguage.toLowerCase() === "python";
    }

    private get isActive(): boolean {
        return this.papyros.runtime.running === this.papyros;
    }

    private get otherRunning(): boolean {
        return this.papyros.runtime.isBusyFor(this.papyros);
    }

    private get dirty(): boolean {
        return this.papyros.runner.code !== this.code;
    }

    private get titleText(): string {
        return this.label ?? this.t("Papyros.playground.title");
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this.observeForPreload();
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.stopWatchingForPreload();
    }

    private stopWatchingForPreload(): void {
        if (this.preloadRuntime) {
            stopPreloading(this, this.preloadRuntime);
            this.preloadRuntime = undefined;
        }
    }

    private observeForPreload(): void {
        this.stopWatchingForPreload();
        if (this.isConnected && this.supported) {
            this.preloadRuntime = this.papyros.runtime;
            preloadWhenVisible(this, this.papyros);
        }
    }

    protected override willUpdate(changedProperties: PropertyValues): void {
        super.willUpdate(changedProperties);
        if (changedProperties.has("code")) {
            this.papyros.runner.code = this.code;
        }
        if (this.hasUpdated && (changedProperties.has("papyros") || changedProperties.has("programmingLanguage"))) {
            this.observeForPreload();
        }

        // Release the reserved height when the run ends. Done before rendering so it folds
        // into this render instead of scheduling a second one.
        const active = this.isActive;
        if (this.wasActive && !active) {
            this.reservedHeight = 0;
        }
        this.wasActive = active;

        // Focus lands on <body> when the element holding it disappears, which loses the
        // user's place in the page. Detect that here, before the input row is removed,
        // so updated() can hand focus to the run/stop button instead.
        const input = this.renderRoot.querySelector("input");
        if (input && this.shadowRoot?.activeElement === input && !(active && this.papyros.io.awaitingInput)) {
            this.restoreFocus = true;
        }

        // Read the scroll position before the render changes the content; updated() acts on it.
        const log = this.outputLog;
        this.followOutput =
            log !== null && log.scrollHeight - log.scrollTop - log.clientHeight <= SCROLL_BOTTOM_TOLERANCE;
    }

    protected override updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        const log = this.outputLog;
        if (log && this.scrollToTop) {
            log.scrollTop = 0;
        } else if (log && this.followOutput) {
            log.scrollTop = log.scrollHeight;
        }
        this.scrollToTop = false;

        // Focus programmatically on the awaiting-input transition rather than with autofocus,
        // which a cross-origin iframe blocks. This follows the Run gesture, so it is allowed.
        const awaitingInput = this.isActive && this.papyros.io.awaitingInput;
        const restoreFocus = this.restoreFocus;
        this.restoreFocus = false;
        if (awaitingInput && !this.wasAwaitingInput) {
            this.renderRoot.querySelector("input")?.focus();
        } else if (restoreFocus) {
            this.runStopButton?.focus();
        }
        this.wasAwaitingInput = awaitingInput;
    }

    private get runStopButton(): HTMLButtonElement | null {
        return this.renderRoot.querySelector<HTMLButtonElement>(".pill");
    }

    private get outputLog(): HTMLElement | null {
        return this.renderRoot.querySelector<HTMLElement>(".output");
    }

    private async run(): Promise<void> {
        // Measure the output height before the run empties it, so the panel body can hold its
        // height across the run instead of collapsing and regrowing. Capped at the height that
        // fits in the log: a log the reservation alone makes scrollable never reads as "at the
        // bottom" in willUpdate, so the run would not follow its output.
        const log = this.outputLog;
        const body = this.renderRoot.querySelector<HTMLElement>(".output-body");
        this.reservedHeight =
            log && body ? Math.min(body.offsetHeight, log.clientHeight - (log.scrollHeight - body.offsetHeight)) : 0;
        this.scrollToTop = true;
        this.preparing = true;
        this.launchFailed = false;
        try {
            await this.papyros.runner.ensureLaunched();
        } catch (error) {
            this.papyros.errorHandler(
                new PapyrosLaunchError("Launching the code playground runtime failed", { cause: error }),
            );
            this.launchFailed = true;
            return;
        } finally {
            this.preparing = false;
        }
        // An empty file list starts every run from an empty workspace
        this.papyros.runner.start(RunMode.Run, []).catch((error) => this.papyros.errorHandler(error));
    }

    private onRunStopClick(): void {
        if (this.isActive) {
            void this.papyros.runner.stop();
            return;
        }
        // Native `disabled` never lands on this button: the browser blurs a focused element
        // the moment it turns disabled, and the launch window is short enough that the user
        // would lose focus mid-gesture. Both gates are aria-disabled, so enforce them here.
        if (this.otherRunning || this.preparing) {
            return;
        }
        void this.run();
    }

    private reset(): void {
        // Reset disables itself as `dirty` clears, dropping focus to <body>; hand it to the
        // run/stop button, but only when Reset was the one holding it.
        this.restoreFocus = this.shadowRoot?.activeElement === this.renderRoot.querySelector(".reset");
        this.papyros.runner.code = this.code;
        this.papyros.io.reset();
        this.launchFailed = false;
    }

    private onInputKeydown(e: KeyboardEvent): void {
        // An IME confirms composed text with Enter, which must not submit the line.
        if (e.key !== "Enter" || e.isComposing) {
            return;
        }
        e.preventDefault();
        const input = e.target as HTMLInputElement;
        const value = input.value;
        // Papyros does not echo input into its output, so the transcript would miss the line
        this.papyros.io.output = [...this.papyros.io.output, { type: OutputType.stdout, content: value + "\n" }];
        this.papyros.io.provideInput(value);
        input.value = "";
    }

    private statusText(): string {
        if (!this.preparing && !this.isActive) {
            return "";
        }
        // The runner is already back in Ready while the runtime is still downloading, so it has no message then
        return this.papyros.runner.stateMessage || this.t("Papyros.states.loading");
    }

    protected override render(): TemplateResult {
        return this.supported ? this.renderCard() : this.renderConfigError();
    }

    private renderCard(): TemplateResult {
        const active = this.isActive;
        const otherRunning = this.otherRunning;
        const gated = otherRunning || (!active && this.preparing);
        const showInput = active && this.papyros.io.awaitingInput;
        const icons = this.papyros.constants.icons;

        return html`
            <div class="card" role="group" aria-labelledby=${this.titleText ? "title" : nothing}>
                <div class="toolbar">
                    ${this.titleText ? html`<span class="title" id="title">${this.titleText}</span>` : nothing}
                    <div class="actions">
                        <button
                            class="text-button reset"
                            ?disabled=${active || !this.dirty}
                            title=${this.t("Papyros.playground.reset_hint")}
                            @click=${this.reset}
                        >
                            <span class="icon" aria-hidden="true">${icons.restore}</span>
                            ${this.t("Papyros.playground.reset")}
                        </button>
                        <button
                            class="pill ${active ? "stop" : "run"}"
                            aria-disabled=${gated ? "true" : nothing}
                            aria-describedby=${otherRunning ? "run-gate" : nothing}
                            title=${otherRunning ? this.t("Papyros.playground.other_running") : nothing}
                            @click=${this.onRunStopClick}
                        >
                            ${active ? nothing : html`<span class="icon" aria-hidden="true">${icons[RunMode.Run]}</span>`}
                            ${active ? this.t("Papyros.playground.stop") : this.t("Papyros.playground.run")}
                        </button>
                        ${
                            otherRunning
                                ? html`<span id="run-gate" class="visually-hidden"
                                      >${this.t("Papyros.playground.other_running")}</span
                                  >`
                                : nothing
                        }
                    </div>
                </div>
                <p-code .papyros=${this.papyros}></p-code>
                ${showInput ? this.renderInput() : nothing} ${this.renderPanels()}
            </div>
        `;
    }

    private renderConfigError(): TemplateResult {
        return html`
            <div class="config-error">
                <div class="config-error-title">${this.t("Papyros.playground.config_error_title")}</div>
                <div>${this.t("Papyros.playground.unsupported_language", { language: this.programmingLanguage })}</div>
            </div>
        `;
    }

    private renderInput(): TemplateResult {
        const prompt = this.papyros.io.prompt;
        return html`
            <div class="input-row">
                ${prompt ? html`<span class="prompt" id="prompt">${prompt}</span>` : nothing}
                <input
                    type="text"
                    aria-label=${this.t("Papyros.playground.input_label")}
                    aria-describedby=${prompt ? "prompt" : nothing}
                    placeholder=${this.t("Papyros.playground.input_placeholder")}
                    @keydown=${this.onInputKeydown}
                />
            </div>
        `;
    }

    private bodyReservationStyle(): Record<string, string> {
        // Pin the floor without a transition while reserving, so the body never collapses before
        // it regrows. Releasing (empty style) restores the transition for the ease-down.
        if (this.reservedHeight > OUTPUT_BODY_MIN_HEIGHT) {
            return { minHeight: `${this.reservedHeight}px`, transition: "none" };
        }
        return {};
    }

    private computePanels(): { outputBlocks: (TemplateResult | typeof nothing)[]; errors: OutputEntry[] } {
        const outputs = this.outputs;
        if (this.panelsCache?.source === outputs) {
            return this.panelsCache;
        }

        const outputBlocks: (TemplateResult | typeof nothing)[] = [];
        const errors: OutputEntry[] = [];
        let text = "";
        const flushText = (): void => {
            if (text) {
                outputBlocks.push(html`<pre class="transcript">${text}</pre>`);
                text = "";
            }
        };

        // Caps rendered entries like p-output does; the rest is not walked on every render.
        const maxLength = this.papyros.constants.maxOutputLength;
        const truncated = outputs.length > maxLength;
        const entries = truncated ? outputs.slice(0, maxLength) : outputs;

        for (const entry of entries) {
            if (entry.type === OutputType.stderr) {
                errors.push(entry);
            } else if (entry.type === OutputType.stdout && typeof entry.content === "string") {
                text += entry.content;
            } else if (entry.type === OutputType.img) {
                flushText();
                const contentType = entry.contentType ?? "image/png";
                outputBlocks.push(
                    html`<img class="output-img" src="data:${contentType};base64,${entry.content}" alt="" />`,
                );
            }
            // Turtle output is not shown in playgrounds
        }
        flushText();

        if (truncated) {
            outputBlocks.push(
                html`<div class="transcript">
                    ${this.t("Papyros.playground.output_truncated", { limit: maxLength })}
                </div>`,
            );
        }

        const result = { source: outputs, outputBlocks, errors };
        this.panelsCache = result;
        return result;
    }

    private renderPanels(): TemplateResult | typeof nothing {
        // The panel stays mounted for the whole run so the card doesn't collapse when the
        // run briefly empties the output on start; only the body content changes.
        if (this.outputs.length === 0 && !this.isActive && !this.preparing) {
            return this.launchFailed ? this.renderLaunchError() : nothing;
        }

        const { outputBlocks, errors } = this.computePanels();

        return html`
            <div
                class="output"
                role="log"
                tabindex="0"
                aria-live="polite"
                aria-label=${this.t("Papyros.playground.output_label")}
            >
                <div class="panel-label">${this.t("Papyros.playground.output_panel_label")}</div>
                <div class="output-body" style=${styleMap(this.bodyReservationStyle())}>
                    ${
                        outputBlocks.length === 0 && (this.preparing || this.isActive)
                            ? html`<div class="status-line">
                                  <md-circular-progress indeterminate aria-hidden="true"></md-circular-progress
                                  >${this.statusText()}
                              </div>`
                            : outputBlocks
                    }
                </div>
            </div>
            ${errors.map((entry) => this.renderError(entry))} ${this.launchFailed ? this.renderLaunchError() : nothing}
        `;
    }

    private renderLaunchError(): TemplateResult {
        return html`<div class="error">
            <div class="error-title" role="alert">${this.t("Papyros.playground.error")}</div>
        </div>`;
    }

    private renderError(entry: OutputEntry): TemplateResult {
        const content = entry.content;
        if (typeof content !== "string" && "name" in content) {
            return html`<div class="error">
                <p-friendly-error .error=${content} .papyros=${this.papyros}></p-friendly-error>
            </div>`;
        }
        const text = typeof content === "string" ? content : JSON.stringify(content);
        return html`<div class="error"><div class="error-title" role="alert">${text}</div></div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "p-code-playground": CodePlayground;
    }
}
