import {customElement} from "lit/decorators.js";
import {css, html} from "lit";
import {PapyrosElement} from "../extras/PapyrosElement";
import "../CodeRunner";
import "../Debugger";
import "../Output";
import "../Input";
import "./ProgrammingLanguagePicker";

@customElement("p-app")
export class App extends PapyrosElement {
    static get styles() {
        return css`
            :host {
                width: 100%;
                height: 100%;
                display: block;
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
                min-height: 0;
                min-width: 0;
                padding: 1rem;
                margin: 0.5rem;
                border-radius: 1rem;
                background-color: var(--papyros-surface, #ccc);
                overflow: auto;
            }
        `;
    }

    protected override render() {
        return html`
            <div class="rows">
                <div class="top">
                    <div class="left">
                        <p-code-runner .papyros=${this.papyros} class="container">
                            <p-programming-language-picker .papyros=${this.papyros}
                                                           slot="buttons"
                            ></p-programming-language-picker>
                        </p-code-runner>
                    </div>
                    <div class="right">
                        <div class="container grow">
                            <p-output .papyros=${this.papyros}></p-output>
                        </div>
                        <div class="container">
                            <p-input .papyros=${this.papyros}></p-input>
                        </div>
                    </div>
                </div>
                <div class="bottom container">
                    <p-debugger .papyros=${this.papyros}></p-debugger>
                </div>
            </div>
        `;
    }
}
