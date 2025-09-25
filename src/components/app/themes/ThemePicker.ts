import {customElement} from "lit/decorators.js";
import {html, LitElement, TemplateResult} from "lit";
import blueLight from "./blue-light.css?inline";
import blueDark from "./blue-dark.css?inline";
import greenLight from "./green-light.css?inline";
import greenDark from "./green-dark.css?inline";
import redLight from "./red-light.css?inline";
import redDark from "./red-dark.css?inline";
import "./ThemedButton";

type Theme = { theme: CSSStyleSheet; dark: boolean };
const _themes = [
    { theme: blueLight, dark: false },
    { theme: blueDark, dark: true },
    { theme: greenLight, dark: false },
    { theme: greenDark, dark: true },
    { theme: redLight, dark: false },
    { theme: redDark, dark: true },
] as { theme: string; dark: boolean }[];

const themes = _themes.map(t => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(t.theme);
    return { theme: sheet, dark: t.dark };
});

@customElement('p-theme-picker')
export class ThemePicker extends LitElement {
    constructor() {
        super();
        this.setTheme(themes[0]);
    }

    setTheme(theme: Theme) {
        document.documentElement.style.setProperty('color-scheme', theme.dark ? 'dark' : 'light');
        document.adoptedStyleSheets = [theme.theme];
    }

    protected override render(): TemplateResult[] {
        return themes.map(t => html`
            <p-themed-button .theme=${t.theme} 
                             .dark=${t.dark}
                            @click=${() => this.setTheme(t)}
            ></p-themed-button>
        `);
    }
}