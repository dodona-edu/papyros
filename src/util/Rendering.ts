import { getElement, getSelectOptions } from "./Util";

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
    /**
     * Whether to render in dark mode
     */
    darkMode?: boolean;
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
    parent.classList.toggle("dark", Boolean(options.darkMode));
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
    class="m-1 px-3 py-1 rounded-lg
    disabled:opacity-50 disabled:cursor-not-allowed${options.extraClasses}">
    ${options.buttonText}
</button>`;
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
