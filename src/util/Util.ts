import I18n from "i18n-js";
import { TRANSLATIONS } from "../Translations";
import { LogType, papyrosLog } from "./Logging";
import { DEFAULT_DARK_MODE_CLASSES } from "./Rendering";

// Shorthand for ease of use
export const t = I18n.t;

/**
 * Add the translations for Papyros to the I18n instance
 */
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

/**
 * Constructs the options for use within an HTML select element
 * @param {Array<T>} options All options to display in the list
 * @param {function(T):string} optionText Function to convert the elements to a string
 * @param {T} selected The initially selected element in the list, if any
 * @return {string} The string representation of the select options
 */
export function getSelectOptions<T>(
    options: Array<T>, optionText: (option: T) => string, selected?: T): string {
    return options.map((option: T) => {
        const selectedValue = option === selected ? "selected" : "";
        return `
            <option ${selectedValue} value="${option}" class="${DEFAULT_DARK_MODE_CLASSES}">
                ${optionText(option)}
            </option>
        `;
    }).join("\n");
}

/**
 * Helper type to access a HTML element, either via its id or the element itself
 */
type ElementIdentifier = string | HTMLElement;

/**
 * Resolve an ElementIdentifier to the corresponding HTLMElement
 * @param {ElementIdentifier} elementId The identifier for the element
 * @return {T} The corresponding element
 */
export function getElement<T extends HTMLElement>(elementId: ElementIdentifier): T {
    if (typeof elementId === "string") {
        return document.getElementById(elementId) as T;
    } else {
        return elementId as T;
    }
}

/**
 * Add a listener to an HTML element for an event on an attribute
 * Element attributes tend to be strings, but string Enums can also be used
 * by using the type-parameter T
 * @param {ElementIdentifier} elementId Identifier for the element
 * @param {function(T)} onEvent The listener for the event
 * @param {string} eventType The type of the event
 * @param {string} attribute The attribute affected by the event
 */
export function addListener<T extends string>(
    elementId: ElementIdentifier, onEvent: (e: T) => void, eventType = "change", attribute = "value"
): void {
    const element = getElement(elementId);
    element.addEventListener(eventType, () => {
        onEvent((element as any)[attribute] || element.getAttribute(attribute) as T);
    });
}

/**
 * Unset the selected item of a select element to prevent a default selection
 * @param {ElementIdentifier} selectId Identifier for the select element
 */
export function removeSelection(selectId: string): void {
    getElement<HTMLSelectElement>(selectId).selectedIndex = -1;
}

/**
 * Parse the data contained within a PapyrosEvent using its contentType
 * Supported content types are: text/plain, text/json, img/png;base64
 * @param {string} data The data to parse
 * @param {string} contentType The content type of the data
 * @return {any} The parsed data
 */
export function parseData(data: string, contentType?: string): any {
    if (!contentType) {
        return data;
    }
    const [baseType, specificType] = contentType.split("/");
    switch (baseType) {
        case "text": {
            switch (specificType) {
                case "plain": {
                    return data;
                }
                case "json": {
                    return JSON.parse(data);
                }
                case "integer": {
                    return parseInt(data);
                }
                case "float": {
                    return parseFloat(data);
                }
            }
            break;
        }
        case "img": {
            switch (specificType) {
                case "png;base64": {
                    return data;
                }
            }
            break;
        }
        case "application": {
            // Content such as application/json does not need parsing as it is in the correct shape
            return data;
        }
    }
    papyrosLog(LogType.Important, `Unhandled content type: ${contentType}`);
    return data;
}
