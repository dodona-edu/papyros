import { customElement } from "lit/decorators.js";
import { adoptStyles, css, CSSResult, html, TemplateResult } from "lit";
import { PapyrosElement } from "../PapyrosElement";
import "../CodeRunner";
import "../Debugger";
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

@customElement("p-app")
export class App extends PapyrosElement {
    subscriptions: (() => void)[] = []

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

            .top {
                flex: 2;
                display: flex;
                min-height: 0;
            }

            .bottom {
                flex: 1;
                min-height: 0;
            }

            .left {
                flex: 1;
                min-width: 0;
                display: flex;
            }

            .right {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 0;
                min-height: 0;
            }
            
            .grow {
                flex-grow: 1;
            }

            .container {
                padding: 1.5rem;
                margin: 0.5rem;
                border-radius: 1rem;
                background-color: var(--md-sys-color-surface-container);
                color: var(--md-sys-color-on-surface);
            }
            
            .overflow {
                overflow: auto;
            }
            
            .header {
                align-items: center;
                padding: 1rem 2rem;
                display: flex;
                justify-content: space-between;
                background-color: var(--md-sys-color-surface-container);
                color: var(--md-sys-color-on-surface);
            }
            
            .title {
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--md-sys-color-primary);
            }
            
            .header-options {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }
            
            .content {
                max-width: 1500px;
                width: 100%;
                height: 100%;
                margin: 1rem auto;
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
        this.initializeLocalStorageProperty(this.papyros.i18n, "locale");
        this.initializeLocalStorageProperty(this.papyros.runner, "code");
        this.initializeLocalStorageProperty(this.papyros.runner, "programmingLanguage");
        this.initializeLocalStorageProperty(this.papyros.constants, "activeTheme");
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.subscriptions.forEach(s => s());
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
        adoptStyles((this.renderRoot as ShadowRoot), [App.styles, theme.theme]);
    }

    protected override render(): TemplateResult {
        this.setTheme(this.papyros.constants.activeTheme);
        return html`
            <div class="rows">
                <div class="header">
                    <div class="header-options">
                        <span class="title">${this.t("Papyros.Papyros")}</span>
                        <md-icon-button href="https://github.com/dodona-edu/papyros" target="_blank" rel="noopener">
                            <md-icon>
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2 2 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.2-2.84a3.76 3.76 0 010-2.93s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.76 3.76 0 010 2.93c.83.74 1.2 1.74 1.2 2.94 0 4.21-2.57 5.13-5.04 5.4.45.37.82.92.82 2.02v3.03c0 .27.1.64.73.55A11 11 0 0012 1.27"></path></svg>
                            </md-icon>
                        </md-icon-button>
                    </div>
                    <div class="header-options">
                        <p-theme-picker .papyros=${this.papyros}></p-theme-picker>
                        <p-language-picker .papyros=${this.papyros}></p-language-picker>
                        <p-programming-language-picker .papyros=${this.papyros}
                        ></p-programming-language-picker>
                    </div>
                </div>
                <div class="content">
                    <div class="top">
                        <div class="left container">
                            <p-code-runner .papyros=${this.papyros} class="overflow">
                                <p-example-picker .papyros=${this.papyros} slot="buttons"></p-example-picker>
                            </p-code-runner>
                        </div>
                        <div class="right">
                            <div class="container grow overflow">
                                <p-output .papyros=${this.papyros}></p-output>
                            </div>
                            <div class="container">
                                <p-input .papyros=${this.papyros}></p-input>
                            </div>
                        </div>
                    </div>
                    <div class="bottom container overflow">
                        <p-debugger .papyros=${this.papyros}></p-debugger>
                    </div>
                </div>
            </div>
        `;
    }
}
