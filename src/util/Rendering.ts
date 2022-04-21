/* eslint-disable max-len */
import { getElement } from "./Util";
export const DARK_MODE_BG_COLOR = "#37474F";
export const DARK_MODE_CONTENT_COLOR = "#263238";
export const DARK_MODE_BLUE = "#0277BD";

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
 * Helper method to append classes to the class attribute of an HTMLElement
 * Consecutive whitespace is not allowed
 * @param {Object} options Object containing classNames
 * @param {string} classNames The classes to append
 */
export function appendClasses(options: { classNames?: string }, classNames: string): void {
    if (options.classNames && !options.classNames.includes(classNames)) {
        options.classNames = `${options.classNames} ${classNames}`;
    } else {
        options.classNames = classNames;
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
    classNames?: string;
}

/**
 * Construct a HTML button string from the given options
 * @param {ButtonOptions} options The options for the button
 * @return {string} HTML string for the button
 */
export function renderButton(options: ButtonOptions): string {
    appendClasses(options,
        "m-1 px-3 py-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed");
    return `
<button id="${options.id}" type="button"
    class="${options.classNames}">
    ${options.buttonText}
</button>`;
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
            <option ${selectedValue} value="${option}" class="dark:text-white dark:bg-[${DARK_MODE_BG_COLOR}]">
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
    const label = labelText ?
        `<label for="${selectId}"
         class="dark:text-white dark:bg-[${DARK_MODE_BG_COLOR}] px-1">
            ${labelText}:
        </label>
    `: "";
    const select = `
    <select id="${selectId}" class="m-2 border-2 px-1 rounded-lg
    dark:text-white dark:bg-[${DARK_MODE_BG_COLOR}] dark:border-[${DARK_MODE_CONTENT_COLOR}]">
        ${getSelectOptions(options, optionText, selected)}
    </select>`;
    return `
    ${label}
    ${select}
    `;
}

/**
 * Helper superclass to handle storing options used during rendering
 * to allow re-rendering without needing to explicitly store used options each time
 */
export abstract class Renderable<Options = RenderOptions> {
    /**
     * The options to render with
     */
    private _renderOptions?: Options;

    protected get renderOptions(): Options {
        if (!this._renderOptions) {
            throw new Error(`${this.constructor.name} not yet rendered!`);
        }
        return this._renderOptions!;
    }
    /**
     * Render this component into the DOM
     * @param {Options} options Optional options to render with. If omitted, stored options are used
     */
    public render(options?: Options): void {
        if (options) {
            this._renderOptions = options;
        }
        this._render(this.renderOptions!);
    }

    /**
     * Internal method to actually perform the rendering
     * @param {Options} options The options to render with
     */
    protected abstract _render(options: Options): void;
}
