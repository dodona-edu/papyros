import {customElement} from "lit/decorators.js";
import {css, html} from "lit";
import {PapyrosElement} from "../extras/PapyrosElement";
import "../CodeRunner";
import "../Debugger";
import "../Output";
import "../Input";
import "./ProgrammingLanguagePicker";
import "./ExamplePicker";
import "./LanguagePicker";
import "./themes/ThemePicker";

@customElement("p-app")
export class App extends PapyrosElement {
    static get styles() {
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

    protected override render() {
        return html`
            <div class="rows">
                <div class="header">
                    <span class="title">${this.t("Papyros.Papyros")}</span>
                    <div class="header-options">
                        <p-theme-picker></p-theme-picker>
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
