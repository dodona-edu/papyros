import I18n from "i18n-js";
import { TRANSLATIONS } from "../Translations";

export const t = I18n.t;

export function loadTranslations(): void {
    for (const [language, translations] of Object.entries(TRANSLATIONS)) {
        // Add keys to already existing translations if they exist
        I18n.translations[language] = Object.assign(
            (I18n.translations[language] || {}),
            translations
        );
    }
}

export function getLocales(): Array<string> {
    return Object.keys(TRANSLATIONS);
}


export function getSelectOptions<T>(
    options: Array<T>, selected: T, optionText: (option: T) => string): string {
    return options.map(option => {
        const selectedValue = selected === option ? "selected" : "";
        return `
            <option ${selectedValue} value="${option}">
                ${optionText(option)}
            </option>
        `;
    }).join("\n");
}

export function addListener<T extends string>(
    elementId: string, onEvent: (e: T) => void, eventType = "change", attribute = "value"
): void {
    const element = document.getElementById(elementId) as HTMLElement;
    element.addEventListener(eventType, () => {
        onEvent((element as any)[attribute] || element.getAttribute(attribute) as T);
    });
}

