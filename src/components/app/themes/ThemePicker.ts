import {customElement} from "lit/decorators.js";
import {html, LitElement, TemplateResult} from "lit";
import blueLight from "./light.css?inline";
import blueDark from "./dark.css?inline";
import greenLight from "./green-light.css?inline";
import greenDark from "./green-dark.css?inline";
import "./ThemedButton";

const _themes = [
    { theme: blueLight, dark: false },
    { theme: blueDark, dark: true },
    { theme: greenLight, dark: false },
    { theme: greenDark, dark: true },
] as { theme: string; dark: boolean }[];

const themes = _themes.map(t => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(t.theme);
    return { theme: sheet, dark: t.dark };
});

@customElement('p-theme-picker')
export class ThemePicker extends LitElement {

    protected override render(): TemplateResult[] {
        return themes.map(t => html`
            <p-themed-button .theme=${t.theme} 
                             .dark=${t.dark}
                            @click=${() => {
                                document.documentElement.style.setProperty('color-scheme', t.dark ? 'dark' : 'light');
                                document.adoptedStyleSheets = [t.theme];
                            }}
            ></p-themed-button>
        `);
    }
}