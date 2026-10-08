import { customElement, property } from "lit/decorators.js";
import { CSSResultGroup, html, nothing, TemplateResult } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import { PapyrosElement } from "./PapyrosElement";
import { OutputEntry } from "../state/InputOutput";
import { PapyrosLaunchError } from "../state/PapyrosErrors";
import { RunMode } from "../../backend/Backend";
import { PlaygroundFiles } from "./playground/files";
import { PlaygroundInstance } from "./playground/instance";
import { PlaygroundOutput } from "./playground/output";
import { cardStyles, configErrorStyles, fileStyles, outputPanelStyles } from "./playground/styles";
import { statusStyles } from "./playground/status";
import { outputStyles } from "./output/renderOutput";
import "./code_runner/Code";

/**
 * An inline, runnable Python code block with its own output and input.
 *
 * Every playground needs its own Papyros instance. Without a `.papyros`, a playground gets
 * one on a runtime shared by every such playground. Instances that share a PapyrosRuntime
 * boot Python once and take turns running: while one runs, the others offer no Run.
 *
 * @element p-code-playground
 */
@customElement("p-code-playground")
export class CodePlayground extends PapyrosElement {
    static get styles(): CSSResultGroup {
        return [cardStyles, fileStyles, outputPanelStyles, statusStyles, configErrorStyles, outputStyles];
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

    /**
     * Space-separated paths of data files the code can open, resolved against the document's
     * base URL. They show as read-only tabs above the editor and are the only files a run
     * starts with.
     */
    @property({ type: String })
    files = "";

    private readonly runStopButton = createRef<HTMLButtonElement>();

    private readonly instance = new PlaygroundInstance(this, () => this.supported);
    private readonly output = new PlaygroundOutput(this, () => this.focusRunStop());
    private readonly dataFiles = new PlaygroundFiles(this);

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
        return this.papyros.runtime.isRunning(this.papyros);
    }

    private get otherRunning(): boolean {
        const run = this.papyros.runtime.currentRun;
        return run !== null && run.owner !== this.papyros;
    }

    /**
     * Whether Reset has something to undo: edited code, or anything shown below the editor
     */
    private get canReset(): boolean {
        return (
            !this.isActive &&
            (this.papyros.runner.code !== this.code ||
                this.papyros.io.output.length > 0 ||
                this.output.launchFailed ||
                this.dataFiles.failed)
        );
    }

    private get titleText(): string {
        return this.label ?? this.t("Papyros.playground.title");
    }

    private focusRunStop(): void {
        this.runStopButton.value?.focus();
    }

    private run(): void {
        this.output.onRunStart();
        this.dataFiles.clearFailures();
        // Launched while the files load, so the two overlap; a run started while the runtime
        // still loads waits for it
        this.papyros.runner.ensureLaunched().catch((error) => {
            this.papyros.errorHandler(
                new PapyrosLaunchError("Launching the code playground runtime failed", { cause: error }),
            );
            this.output.onLaunchFailed();
        });
        // Passing the files, even none, starts every run from a workspace holding only those
        this.papyros.runner
            .start(RunMode.Run, this.dataFiles.loadForRun())
            .catch((error) => this.papyros.errorHandler(error));
    }

    private onRunStopClick(): void {
        if (this.isActive) {
            void this.papyros.runner.stop();
            return;
        }
        // Native `disabled` never lands on this button: the browser blurs a focused element
        // the moment it turns disabled. The gate is aria-disabled, so enforce it here.
        if (this.otherRunning) {
            return;
        }
        this.run();
    }

    private reset(e: Event): void {
        // aria-disabled, like Run, so enforce it here
        if (!this.canReset) {
            return;
        }
        // Reset has nothing left to undo afterwards; hand focus to the run/stop button, but
        // only when Reset was the one holding it.
        if (this.shadowRoot?.activeElement === e.currentTarget) {
            void this.updateComplete.then(() => this.focusRunStop());
        }
        this.papyros.runner.code = this.code;
        this.output.reset();
        this.dataFiles.clearFailures();
    }

    protected override render(): TemplateResult {
        if (!this.supported) {
            return this.renderConfigError(
                this.t("Papyros.playground.unsupported_language", { language: this.programmingLanguage }),
            );
        }
        const filesError = this.dataFiles.configError;
        if (filesError !== undefined) {
            return this.renderConfigError(filesError);
        }
        return this.renderCard();
    }

    private renderCard(): TemplateResult {
        const active = this.isActive;
        const otherRunning = this.otherRunning;
        const icons = this.papyros.constants.icons;

        return html`
            <div class="card" role="group" aria-labelledby=${this.titleText ? "title" : nothing}>
                <div class="toolbar">
                    ${this.titleText ? html`<span class="title" id="title">${this.titleText}</span>` : nothing}
                    <div class="actions">
                        <button
                            class="text-button reset"
                            aria-disabled=${this.canReset ? nothing : "true"}
                            title=${this.t("Papyros.playground.reset_hint")}
                            @click=${this.reset}
                        >
                            <span class="icon" aria-hidden="true">${icons.restore}</span>
                            ${this.t("Papyros.playground.reset")}
                        </button>
                        <button
                            ${ref(this.runStopButton)}
                            class="pill ${active ? "stop" : "run"}"
                            aria-disabled=${otherRunning ? "true" : nothing}
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
                ${this.dataFiles.renderTabs()}
                ${this.dataFiles.renderCodePanel(html`<p-code .papyros=${this.papyros}></p-code>`)}
                ${this.output.renderPanels()}
            </div>
        `;
    }

    private renderConfigError(message: string): TemplateResult {
        return html`
            <div class="config-error">
                <div class="config-error-title">${this.t("Papyros.playground.config_error_title")}</div>
                <div>${message}</div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "p-code-playground": CodePlayground;
    }
}
