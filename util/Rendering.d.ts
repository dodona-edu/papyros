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
 * as consecutive whitespace is not allowed
 * @param {Object} options Object containing classNames
 * @param {string} classNames The classes to append
 */
export declare function appendClasses(options: {
    classNames?: string;
}, classNames: string): void;
/**
 * Helper method to add attributes to options with a possibly undefined attribute Map
 * @param {Object} options Object containing attributes
 * @param {Map<string, string>} attributes The attributes to add
 */
export declare function addAttributes(options: {
    attributes?: Map<string, string>;
}, attributes: Map<string, string>): void;
/**
 * Renders an element with the given options
 * @param {RenderOptions} options Options to be used while rendering
 * @param {string | HTMLElement} content What to fill the parent with.
 * If the content is a string, it should be properly formatted HTML
 * @return {HTMLElement} The parent with the new child
 */
export declare function renderWithOptions(options: RenderOptions, content: string | HTMLElement): HTMLElement;
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
export declare function renderButton(options: ButtonOptions): string;
/**
 * Constructs the options for use within an HTML select element
 * @param {Array<T>} options All options to display in the list
 * @param {function(T):string} optionText Function to convert the elements to a string
 * @param {T} selected The initially selected element in the list, if any
 * @return {string} The string representation of the select options
 */
export declare function renderSelectOptions<T extends string>(options: Array<T>, optionText: (option: T) => string, selected?: T): string;
/**
 * Build a string representation of an HTML label element
 * @param {string} labelText Optional text to display in a label
 * If not provided, no label is created
 * @param {string} forElement The id of the element this label is for
 * @return {string} The HTML string of the label
 */
export declare function renderLabel(labelText: string | undefined, forElement: string): string;
/**
 * Constructs an HTML select element
 * @param {string} selectId The HTML id for the element
 * @param {Array<T>} options to display in the list
 * @param {function(T):string} optionText to convert elements to a string
 * @param {T} selected The initially selected element in the list, if any
 * @param {string} labelText Optional text to display in a label
 * @return {string} The string representation of the select element
 */
export declare function renderSelect<T extends string>(selectId: string, options: Array<T>, optionText: (option: T) => string, selected?: T, labelText?: string): string;
/**
 * Helper superclass to handle storing options used during rendering
 * to allow re-rendering without needing to explicitly store used options each time
 */
export declare abstract class Renderable<Options = RenderOptions> {
    /**
     * The options to render with
     */
    private _renderOptions?;
    protected get renderOptions(): Options;
    /**
     * Render this component into the DOM
     * @param {Options} options Optional options to render with. If omitted, stored options are used
     */
    render(options?: Options): void;
    /**
     * Internal method to actually perform the rendering
     * @param {Options} options The options to render with
     */
    protected abstract _render(options: Options): void;
}
