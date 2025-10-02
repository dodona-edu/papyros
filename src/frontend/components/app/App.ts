import { customElement, property } from "lit/decorators.js";
import { adoptStyles, css, CSSResult, html, TemplateResult } from "lit";
import { PapyrosElement } from "../PapyrosElement";
import "../CodeRunner";
import "../Debugger";
import "../Output";
import "../Input";
import "./ProgrammingLanguagePicker";
import "./ExamplePicker";
import "./LanguagePicker";
import "./Resize";
import "./themes/ThemePicker";
import { State } from "@dodona/lit-state";
import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";
import { ThemeOption } from "../../state/Constants";

@customElement("p-app")
export class App extends PapyrosElement {
    subscriptions: (() => void)[] = []
    @property({ state: true })
    private showMenu: boolean = false;

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



                @media (max-width: 1000px) {
                    height: 200vh;
                }
            }

            .rows {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
            }

            .container {
                padding: 1.5rem;
                border-radius: 1rem;
                background-color: var(--md-sys-color-surface-container);
                color: var(--md-sys-color-on-surface);
                flex: 1;
                overflow: auto;
                min-height: 0;
                min-width: 0;
            }

            .header {
                align-items: center;
                padding: 1rem 2rem;
                display: flex;
                justify-content: space-between;
                background-color: var(--md-sys-color-surface-container);
                color: var(--md-sys-color-on-surface);
                
                @media (max-width: 800px) {
                    flex-direction: column;
                }
            }
            
            .title {
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--md-sys-color-primary);
            }
            
            .header-part {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }
            
            .burger {
                display: none;
            }


            @media (max-width: 800px) {
                .header-options {
                    flex-direction: column;
                    gap: 1rem;
                    display: none;
                }
                
                .burger {
                    display: inline-flex;
                }
            }
            
            .content {
                padding: 1rem;
                flex: 1;
                min-width: 0;
                min-height: 0;
                
                @media (max-width: 1000px) {
                    padding: 1rem 0.5rem;
                }
            }
            
            .max-width {
                max-width: 1500px;
                height: 100%;
                margin: auto;
                display: flex;
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
                    <div class="header-part">
                        <span class="title">${this.t("Papyros.Papyros")}</span>
                        <md-icon-button href="https://github.com/dodona-edu/papyros" target="_blank" rel="noopener">
                            <md-icon>
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2 2 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.2-2.84a3.76 3.76 0 010-2.93s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.76 3.76 0 010 2.93c.83.74 1.2 1.74 1.2 2.94 0 4.21-2.57 5.13-5.04 5.4.45.37.82.92.82 2.02v3.03c0 .27.1.64.73.55A11 11 0 0012 1.27"></path></svg>
                            </md-icon>
                        </md-icon-button>
                        <md-icon-button class="burger" @click=${() => this.showMenu = !this.showMenu} aria-label="Menu" title="Menu">
                            <md-icon>
                                <svg viewBox="0 -960 960 960" fill="currentColor"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>
                            </md-icon>
                        </md-icon-button>
                    </div>
                    <div class="header-part header-options" style=${this.showMenu ? "display: flex;" : ""}>
                        <p-theme-picker .papyros=${this.papyros}></p-theme-picker>
                        <p-language-picker .papyros=${this.papyros}></p-language-picker>
                        <p-programming-language-picker .papyros=${this.papyros}
                        ></p-programming-language-picker>
                    </div>
                </div>
                <div class="content">
                    <div class="max-width">
                        <p-resize .percentage=${55} .breakpoint=${1000}>
                            <p-resize column .percentage=${70} slot="first">
                                <p-code-runner .papyros=${this.papyros} class="container" slot="first">
                                    <p-example-picker .papyros=${this.papyros} slot="buttons"></p-example-picker>
                                </p-code-runner>
                                <p-input .papyros=${this.papyros} slot="second" class="container"></p-input>
                            </p-resize>
                            <p-resize column .percentage=${50} slot="second">
                                <p-output .papyros=${this.papyros} slot="first" class="container"></p-output>
                                <p-debugger .papyros=${this.papyros} slot="second" class="container"></p-debugger>
                            </p-resize>
                        </p-resize>
                    </div>
                </div>
            </div>
        `;
    }
}
