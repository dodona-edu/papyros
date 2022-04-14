import I18n from "i18n-js";
import { TRANSLATIONS } from "../Translations";
import { LogType, papyrosLog } from "./Logging";

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
            <option ${selectedValue} value="${option}">
                ${optionText(option)}
            </option>
        `;
    }).join("\n");
}

/**
 * Constructs an HTML select element
 * @param {string} selectId The HTML id for the element
 * @param {Array<T>} options to display in the list
 * @param {function(T):string} optionText to convert elements to a string
 * @param {T} selected The initially selected element in the list, if any
 * @param {string} labelText Optional text to display in a label
 * @return {string} The string representation of the select element
 */
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

/**
 * Interface for options to use while rendering a button element
 */
export interface ButtonOptions {
    /**
     * The HTML id of the button
     */
    id: string;
    /**
     * The text to display in the button, can also be HTML
     */
    buttonText: string;
    /**
     * Optional classes to apply to the button
     */
    extraClasses?: string;
}

/**
 * Construct a HTML button string from the given options
 * @param {ButtonOptions} options The options for the button
 * @return {string} HTML string for the button
 */
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
/**
 * Helper type to access a HTML element, either via its id or the element itself
 */
type ElementIdentifier = string | HTMLElement;

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
    elementId: ElementIdentifier, onEvent: (e: T) => void, eventType: string, attribute?: string
): void {
    const element = getElement(elementId);
    element.addEventListener(eventType, () => {
        const value = attribute ?
            ((element as any)[attribute] || element.getAttribute(attribute) as T) :
            "";
        onEvent(value);
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
 * Useful options for rendering an element
 */
export interface RenderOptions {
    /**
     * String identifier for the parent in which the element will be rendered
     */
    parentElementId: string;
    /**
     * Names of HTML classes to be added to the element, separated by 1 space
     */
    classNames?: string;
    /**
     * Extra attributes to add to the element, such as style or data
     */
    attributes?: Map<string, string>;
}

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
 * Renders an element with the given options
 * @param {RenderOptions} options Options to be used while rendering
 * @param {string | HTMLElement} content What to fill the parent with.
 * If the content is a string, it should be properly formatted HTML
 * @return {HTMLElement} The parent with the new child
 */
export function renderWithOptions(
    options: RenderOptions, content: string | HTMLElement
): HTMLElement {
    const parent = getElement(options.parentElementId);
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

/**
 * Parse the data contained within a PapyrosEvent using its contentType
 * Supported content types are: text/plain, text/json, img/png;base64
 * @param {unknown} data The data to parse
 * @param {string} contentType The content type of the data
 * @return {any} The parsed data
 */
export function parseData(data: unknown, contentType: string): any {
    const typeParts = contentType ? contentType.split("/") : [];
    if (typeParts.length === 2) {
        const [baseType, specificType] = typeParts;
        switch (baseType) {
            case "text": {
                switch (specificType) {
                    case "plain": {
                        return data;
                    }
                    case "json": {
                        return JSON.parse(data as string);
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
        }
    }
    papyrosLog(LogType.Important, `Unhandled content type: ${contentType}`);
    return data;
}
