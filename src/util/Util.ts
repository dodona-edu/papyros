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
    options: Array<T>, optionText: (option: T) => string, selected?: T): string {
    return options.map((option: T) => {
        const selectedValue = option === selected ? "selected" : "";
        return `
            <option ${selectedValue} value="${option}">
                ${optionText(option)}
            </option>
        `;
    }).join("\n");
}

export function renderSelect<T>(selectId: string,
    options: Array<T>, optionText: (option: T) => string, selected?: T,
    labelText?: string): string {
    const label = labelText ? `<label for="${selectId}">${labelText}: </label>
    `: "";
    const select = `
    <select id="${selectId}" class="m-2 border-2">
        ${getSelectOptions(options, optionText, selected)}
    </select>`;
    return `
    ${label}
    ${select}
    `;
}

export interface ButtonOptions {
    id: string;
    buttonText: string;
    extraClasses?: string;
}

export function renderButton(options: ButtonOptions): string {
    if (options.extraClasses) {
        // Prepend space to use in HTML
        options.extraClasses = ` ${options.extraClasses}`;
    }
    return `
<button id="${options.id}" type="button"
    class="border-2 m-1 px-4 inset-y-2 rounded-lg
    disabled:opacity-50 disabled:cursor-wait${options.extraClasses}">
    ${options.buttonText}
</button>`;
}

export function addListener<T extends string>(
    elementId: string, onEvent: (e: T) => void, eventType = "change", attribute = "value"
): void {
    const element = document.getElementById(elementId) as HTMLElement;
    element.addEventListener(eventType, () => {
        onEvent((element as any)[attribute] || element.getAttribute(attribute) as T);
    });
}

export function removeSelection(selectId: string): void {
    (document.getElementById(selectId) as HTMLSelectElement).selectedIndex = -1;
}

export interface RenderOptions {
    parentElementId: string;
    classNames?: string;
    attributes?: Map<string, string>;
}

export function getElement(element: string | HTMLElement): HTMLElement {
    if (typeof element === "string") {
        return document.getElementById(element) as HTMLElement;
    } else {
        return element;
    }
}

export function renderWithOptions(
    options: RenderOptions, content: string | HTMLElement
): HTMLElement {
    const parent = document.getElementById(options.parentElementId) as HTMLElement;
    if (options.classNames) {
        parent.classList.add(...options.classNames.split(" "));
    }
    if (options.attributes) {
        for (const [attr, value] of options.attributes.entries()) {
            parent.setAttribute(attr, value);
        }
    }
    if (typeof content === "string") {
        parent.innerHTML = content;
    } else {
        parent.replaceChildren(content);
    }
    return parent;
}
