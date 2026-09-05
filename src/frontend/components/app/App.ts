import { customElement } from "lit/decorators.js";
import { adoptStyles, css, CSSResult, html, TemplateResult } from "lit";
import { PapyrosElement } from "../PapyrosElement";
import "../CodeRunner";
import "../Debugger";
import { paneStyles } from "../shared-styles";
import "../Output";
import "../Input";
import "./ProgrammingLanguagePicker";
import "./ExamplePicker";
import "./LanguagePicker";
import "./themes/ThemePicker";
import { State } from "@dodona/lit-state";
import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";
import { ThemeOption } from "../../state/Constants";
import { ProgrammingLanguage } from "../../../ProgrammingLanguage";
import { JAVASCRIPT_EXAMPLES } from "./examples/JavaScriptExamples";
import { PYTHON_EXAMPLES } from "./examples/PythonExamples";

@customElement("p-app")
export class App extends PapyrosElement {
    subscriptions: (() => void)[] = [];

    static get styles(): CSSResult {
        return css`
            :host {
                width: 100%;
                height: 100%;
                display: block;
                background-color: var(--md-sys-color-background);
                color: var(--md-sys-color-on-background);
                --md-ref-typeface-brand: Roboto, "Helvetica Neue", sans-serif;
                --md-ref-typeface-plain: var(--md-ref-typeface-brand);
                font-family: var(--md-ref-typeface-brand);
                font-size: 16px;
                --md-outlined-field-bottom-space: 8px;
                --md-outlined-field-top-space: 8px;
                --md-outlined-text-field-bottom-space: 8px;
                --md-outlined-text-field-top-space: 8px;
            }

            .rows {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
            }

            /* The debugger is only worth a quarter of the page while it is empty. Once a run
               fills it, it gets an equal share, which is the least a trace can be read in. */
            .top {
                flex: 3;
                display: flex;
                min-height: 0;
                transition: flex-grow 250ms ease-out;
            }

            .bottom {
                flex: 1;
                /* Enough for the title and its one line of placeholder on a short window. */
                min-height: 6rem;
                margin: 0.5rem;
                transition: flex-grow 250ms ease-out;
            }

            .content.debugging .top {
                flex-grow: 1;
            }

            .content.debugging .bottom {
                flex-grow: 1;
            }

            @media (prefers-reduced-motion: reduce) {
                .top,
                .bottom {
                    transition: none;
                }
            }

            .left {
                flex: 1;
                min-width: 0;
                display: flex;
                margin: 0.5rem;
            }

            .right {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 1rem;
                min-width: 0;
                min-height: 0;
                margin: 0.5rem;
            }

            /* Output must not be squeezed away when the debugger claims its share. */
            .grow {
                flex: 1;
                min-height: 7rem;
            }

            ${paneStyles}

            .pane-title {
                display: flex;
                align-items: center;
                height: 2.25rem;
                padding: 0 0.875rem;
                flex-shrink: 0;
                box-shadow: inset 0 -1px 0 var(--md-sys-color-outline-variant);
                font-size: 0.875rem;
                font-weight: 500;
                color: var(--md-sys-color-primary);
            }

            /* The label carries the indicator, so it is as wide as the text like a real tab. */
            .pane-title span {
                position: relative;
                display: flex;
                align-items: center;
                height: 100%;
            }

            .pane-title span::after {
                content: "";
                position: absolute;
                left: -0.25rem;
                right: -0.25rem;
                bottom: 0;
                height: 2px;
                border-radius: 2px 2px 0 0;
                background-color: var(--md-sys-color-primary);
            }

            .pane-body {
                flex: 1;
                min-height: 0;
                overflow: auto;
                padding: 0.75rem 0.875rem;
            }

            /* The 40px controls set the height of this row, so the padding is all there is
               to give back to the content below. */
            .header {
                align-items: center;
                padding: 0.5rem 1.5rem;
                display: flex;
                justify-content: space-between;
                background-color: var(--md-sys-color-surface-container);
                color: var(--md-sys-color-on-surface);
            }

            .title {
                margin: 0;
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--md-sys-color-primary);
            }

            .header-options {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }

            /* No height here: flex-grow already claims the room the header leaves, and a
               definite height would become this item's automatic minimum, so the page
               scrolled by exactly the header once the panes wanted more than it. */
            .content {
                max-width: 1500px;
                width: 100%;
                min-height: 0;
                /* The panes carry their own 0.5rem, so a full rem here doubled the gap. */
                margin: 0.5rem auto;
                display: flex;
                flex-direction: column;
                flex: 1;
            }
        `;
    }

    constructor() {
        super();
        this.papyros.launch();
    }

    public override connectedCallback(): void {
        super.connectedCallback();
        this.papyros.examples.setExamples(ProgrammingLanguage.JavaScript, JAVASCRIPT_EXAMPLES);
        this.papyros.examples.setExamples(ProgrammingLanguage.Python, PYTHON_EXAMPLES);
        this.initializeLocalStorageProperty(this.papyros.i18n, "locale");
        this.initializeLocalStorageProperty(this.papyros.runner, "code");
        this.initializeLocalStorageProperty(this.papyros.runner, "programmingLanguage");
        this.initializeLocalStorageProperty(this.papyros.constants, "activeTheme");
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.subscriptions.forEach((s) => s());
        this.subscriptions = [];
    }

    initializeLocalStorageProperty(state: State, property: string): void {
        const storedValue = localStorage.getItem(property);
        if (storedValue !== null) {
            try {
                state[property] = JSON.parse(storedValue);
            } catch {
                // ignore invalid JSON
            }
        }

        const unsubscribe = state.subscribe(() => {
            localStorage.setItem(property, JSON.stringify(state[property]));
        }, property);
        this.subscriptions.push(unsubscribe);
    }

    setTheme(theme: ThemeOption): void {
        document.documentElement.style.setProperty("color-scheme", theme.dark ? "dark" : "light");
        adoptStyles(this.renderRoot as ShadowRoot, [App.styles, theme.theme]);
    }

    protected override render(): TemplateResult {
        this.setTheme(this.papyros.constants.activeTheme);
        document.documentElement.lang = this.papyros.i18n.locale;
        return html`
            <div class="rows">
                <header class="header">
                    <div class="header-options">
                        <h1 class="title">${this.t("Papyros.Papyros")}</h1>
                        <md-icon-button
                            href="https://github.com/dodona-edu/papyros"
                            target="_blank"
                            rel="noopener"
                            aria-label=${this.t("Papyros.github_link")}
                        >
                            <md-icon aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2 2 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.2-2.84a3.76 3.76 0 010-2.93s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.76 3.76 0 010 2.93c.83.74 1.2 1.74 1.2 2.94 0 4.21-2.57 5.13-5.04 5.4.45.37.82.92.82 2.02v3.03c0 .27.1.64.73.55A11 11 0 0012 1.27"
                                    ></path>
                                </svg>
                            </md-icon>
                        </md-icon-button>
                    </div>
                    <div class="header-options">
                        <p-theme-picker .papyros=${this.papyros}></p-theme-picker>
                        <p-language-picker .papyros=${this.papyros}></p-language-picker>
                        <p-programming-language-picker .papyros=${this.papyros}></p-programming-language-picker>
                    </div>
                </header>
                <main class="content ${this.papyros.debugger.active ? "debugging" : ""}">
                    <div class="top">
                        <div class="left">
                            <p-code-runner .papyros=${this.papyros}>
                                <p-example-picker .papyros=${this.papyros} slot="buttons"></p-example-picker>
                            </p-code-runner>
                        </div>
                        <div class="right">
                            <p-output .papyros=${this.papyros} class="grow"></p-output>
                            <p-input .papyros=${this.papyros}></p-input>
                        </div>
                    </div>
                    <div class="bottom pane">
                        <div class="pane-title"><span>${this.t("Papyros.debugger_tab")}</span></div>
                        <div class="pane-body">
                            <p-debugger .papyros=${this.papyros}></p-debugger>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }
}
