import { html, nothing, ReactiveController, ReactiveControllerHost, TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { OutputEntry, OutputType } from "../../state/InputOutput";
import { BackendFailure, BackendStatus, RunOutcome, RunStatus } from "../../state/Runner";
import type { Papyros } from "../../state/Papyros";
import { renderError, renderImage, renderOverflow, shownOutput } from "../output/renderOutput";
import { HeightTransition } from "../motion";
import { FollowEnd } from "../output/followEnd";

export interface OutputHost extends ReactiveControllerHost {
    readonly papyros: Papyros;
    readonly renderRoot: HTMLElement | DocumentFragment;
}

/**
 * The output side of a playground: the input row, the output log and the error panels.
 * Renders into the host's shadow root.
 */
export class PlaygroundOutput implements ReactiveController {
    private reservedHeight = 0;
    private readonly followEnd: FollowEnd;
    private wasAwaitingInput = false;
    /** The input row holds focus and is about to go */
    private inputLeaving = false;

    private resizeHost?: HTMLElement;
    private resize?: HeightTransition;
    private resizing = false;
    /** What the panels showed at the previous render */
    private shown: unknown[] = [];

    // Keyed on `outputs` array identity: papyros hands out a fresh array on every change
    // and never mutates it in place.
    private panelsCache?: {
        source: OutputEntry[];
        outputBlocks: (TemplateResult | typeof nothing)[];
        errors: OutputEntry[];
    };

    /**
     * @param {OutputHost} host The playground
     * @param {function(): void} focusRunStop Focuses the run/stop button, which takes over
     *     focus from the input row when the row goes
     */
    constructor(
        private readonly host: OutputHost,
        private readonly focusRunStop: () => void,
    ) {
        this.followEnd = new FollowEnd(host, () => this.log);
        host.addController(this);
    }

    private t(phrase: string, options?: Record<string, any>): string {
        return this.host.papyros.i18n.t(phrase, options);
    }

    private get log(): HTMLElement | null {
        return this.host.renderRoot.querySelector<HTMLElement>(".output");
    }

    private get input(): HTMLInputElement | null {
        return this.host.renderRoot.querySelector<HTMLInputElement>(".input-row input");
    }

    /** The playground's run is in progress, including the wait for the runtime to load */
    private get busy(): boolean {
        return this.host.papyros.runner.inProgress;
    }

    private get awaitingInput(): boolean {
        return this.host.papyros.runner.lifecycle.status === RunStatus.AwaitingInput;
    }

    /** The alert of a Run that could not launch the runtime */
    private get launchError(): string | undefined {
        const { lifecycle, backendStatus } = this.host.papyros.runner;
        if (lifecycle.status !== RunStatus.Ended || lifecycle.outcome !== RunOutcome.LaunchFailed) {
            return undefined;
        }
        return backendStatus.status === BackendStatus.Failed &&
            backendStatus.reason === BackendFailure.UnsupportedBrowser
            ? this.t("Papyros.unsupported_browser")
            : this.t("Papyros.playground.error");
    }

    /** Called when Run is clicked, before the run empties the output */
    onRunStart(): void {
        this.followEnd.restart();
        // Measure the output height before the run empties it, so the panel body can hold its
        // height across the run instead of collapsing and regrowing. Capped at the height that
        // fits in the log: a reservation that makes the log scrollable would have the log follow
        // its empty end, below the new output.
        const log = this.log;
        const body = this.host.renderRoot.querySelector<HTMLElement>(".output-body");
        this.reservedHeight =
            log && body ? Math.min(body.offsetHeight, log.clientHeight - (log.scrollHeight - body.offsetHeight)) : 0;
        this.host.requestUpdate();
    }

    hostUpdate(): void {
        const awaitingInput = this.awaitingInput;
        // Focus lands on <body> when the element holding it disappears, which loses the
        // user's place in the page; hostUpdated() hands it to the run/stop button instead.
        const input = this.input;
        this.inputLeaving =
            !awaitingInput && input !== null && (this.host.renderRoot as ShadowRoot).activeElement === input;

        // Only what opens or closes a panel animates: streamed output grows the log at once,
        // instead of being clipped to the height of an animation that restarts on every chunk.
        const shown = [
            this.host.papyros.io.output.length === 0,
            this.computePanels().errors.length,
            this.busy,
            this.launchError !== undefined,
            awaitingInput,
        ];
        if (shown.some((value, i) => value !== this.shown[i])) {
            this.shown = shown;
            // Animated on the wrapper rather than on the log: holding the log's height would
            // throw off its scroll position, which decides whether the log follows new output.
            this.resize?.capture();
            this.resizing = true;
        }
    }

    hostUpdated(): void {
        const panels = this.host.renderRoot.querySelector<HTMLElement>(".panels");
        if (panels !== this.resizeHost) {
            this.resize?.cancel();
            this.resizeHost = panels ?? undefined;
            this.resize = panels ? new HeightTransition(panels) : undefined;
        } else if (this.resizing) {
            void this.resize?.play();
        }
        this.resizing = false;

        const awaitingInput = this.awaitingInput;
        if (awaitingInput && !this.wasAwaitingInput) {
            // Not autofocus, which a cross-origin iframe blocks. This follows the Run gesture,
            // so focusing programmatically is allowed.
            this.input?.focus();
        } else if (this.inputLeaving) {
            this.focusRunStop();
        }
        this.wasAwaitingInput = awaitingInput;
        this.inputLeaving = false;
    }

    private onInputKeydown(e: KeyboardEvent): void {
        // An IME confirms composed text with Enter, which must not submit the line.
        // Safari sends that Enter with isComposing false and keyCode 229.
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- Safari's IME Enter is only recognisable by keyCode
        if (e.key !== "Enter" || e.isComposing || e.keyCode === 229) {
            return;
        }
        e.preventDefault();
        const input = e.target as HTMLInputElement;
        const value = input.value;
        this.host.papyros.io.provideInput(value);
        input.value = "";
    }

    private renderInput(): TemplateResult {
        const prompt = this.host.papyros.io.prompt;
        return html`
            <div class="input-row">
                ${prompt ? html`<span class="prompt" id="prompt">${prompt}</span>` : nothing}
                <input
                    type="text"
                    aria-label=${this.t("Papyros.playground.input_label")}
                    aria-describedby=${prompt ? "prompt" : nothing}
                    placeholder=${this.t("Papyros.playground.input_placeholder")}
                    @keydown=${(e: KeyboardEvent) => this.onInputKeydown(e)}
                />
            </div>
        `;
    }

    private bodyReservationStyle(busy: boolean): Record<string, string> {
        // A floor for the whole run, so the body never collapses before it regrows. The panels
        // animate down to the natural height once it is lifted.
        return busy ? { "--reserved-height": `${this.reservedHeight}px` } : {};
    }

    private computePanels(): { outputBlocks: (TemplateResult | typeof nothing)[]; errors: OutputEntry[] } {
        const papyros = this.host.papyros;
        const outputs = papyros.io.output;
        if (this.panelsCache?.source === outputs) {
            return this.panelsCache;
        }

        const outputBlocks: (TemplateResult | typeof nothing)[] = [];
        const errors: OutputEntry[] = [];
        // One text node per chunk, so a new chunk adds a node instead of replacing all the text
        let text: string[] = [];
        const flushText = (): void => {
            if (text.length > 0) {
                outputBlocks.push(html`<pre class="transcript">${text}</pre>`);
                text = [];
            }
        };

        // Caps rendered entries like p-output does; the rest is not walked on every render.
        const maxLength = papyros.constants.maxOutputLength;
        const { shown: entries, truncated } = shownOutput(outputs, maxLength);

        for (const entry of entries) {
            if (entry.type === OutputType.stderr) {
                errors.push(entry);
            } else if (entry.type === OutputType.stdout && typeof entry.content === "string") {
                text.push(entry.content);
            } else if (entry.type === OutputType.img) {
                flushText();
                outputBlocks.push(renderImage(entry, papyros));
            }
            // Turtle output is not shown in playgrounds
        }
        flushText();

        if (truncated) {
            outputBlocks.push(renderOverflow(papyros, maxLength));
        }

        const result = { source: outputs, outputBlocks, errors };
        this.panelsCache = result;
        return result;
    }

    renderPanels(): TemplateResult {
        return html`<div class="panels">
            ${this.awaitingInput ? this.renderInput() : nothing} ${this.renderOutput()}
        </div>`;
    }

    private renderOutput(): TemplateResult | typeof nothing {
        const busy = this.busy;
        // The panel stays mounted for the whole run so the card doesn't collapse when the
        // run briefly empties the output on start; only the body content changes.
        if (this.host.papyros.io.output.length === 0 && !busy) {
            return this.launchError === undefined ? nothing : this.renderError(this.launchError);
        }

        const { outputBlocks, errors } = this.computePanels();

        return html`
            <div
                class="output"
                role="log"
                tabindex="0"
                aria-live="polite"
                aria-label=${this.t("Papyros.playground.output_label")}
                @scroll=${this.followEnd.onScroll}
            >
                <div class="panel-label">${this.t("Papyros.playground.output_panel_label")}</div>
                <div class="output-body" style=${styleMap(this.bodyReservationStyle(busy))}>${outputBlocks}</div>
            </div>
            ${errors.map((entry) => this.renderError(entry.content))}
            ${this.launchError === undefined ? nothing : this.renderError(this.launchError)}
        `;
    }

    private renderError(error: unknown): TemplateResult {
        return html`<div class="error">${renderError(error, this.host.papyros, true)}</div>`;
    }
}
