import I18n from "i18n-js";
import { PapyrosEvent } from "../PapyrosEvent";
export declare const t: typeof I18n.t;
/**
 * Add the translations for Papyros to the I18n instance
 */
export declare function loadTranslations(): void;
export declare function getLocales(): Array<string>;
/**
 * Constructs the options for use within an HTML select element
 * @param {Array<T>} options All options to display in the list
 * @param {function(T):string} optionText Function to convert the elements to a string
 * @param {T} selected The initially selected element in the list, if any
 * @return {string} The string representation of the select options
 */
export declare function getSelectOptions<T>(options: Array<T>, optionText: (option: T) => string, selected?: T): string;
/**
 * Constructs an HTML select element
 * @param {string} selectId The HTML id for the element
 * @param {Array<T>} options to display in the list
 * @param {function(T):string} optionText to convert elements to a string
 * @param {T} selected The initially selected element in the list, if any
 * @param {string} labelText Optional text to display in a label
 * @return {string} The string representation of the select element
 */
export declare function renderSelect<T>(selectId: string, options: Array<T>, optionText: (option: T) => string, selected?: T, labelText?: string): string;
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
export declare function renderButton(options: ButtonOptions): string;
/**
 * Helper type to access a HTML element, either via its id or the element itself
 */
declare type ElementIdentifier = string | HTMLElement;
/**
 * Add a listener to an HTML element for an event on an attribute
 * Element attributes tend to be strings, but string Enums can also be used
 * by using the type-parameter T
 * @param {ElementIdentifier} elementId Identifier for the element
 * @param {function(T)} onEvent The listener for the event
 * @param {string} eventType The type of the event
 * @param {string} attribute The attribute affected by the event
 */
export declare function addListener<T extends string>(elementId: ElementIdentifier, onEvent: (e: T) => void, eventType?: string, attribute?: string): void;
/**
 * Unset the selected item of a select element to prevent a default selection
 * @param {ElementIdentifier} selectId Identifier for the select element
 */
export declare function removeSelection(selectId: string): void;
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
export declare function getElement<T extends HTMLElement>(elementId: ElementIdentifier): T;
/**
 * Renders an element with the given options
 * @param {RenderOptions} options Options to be used while rendering
 * @param {string | HTMLElement} content What to fill the parent with.
 * If the content is a string, it should be properly formatted HTML
 * @return {HTMLElement} The parent with the new child
 */
export declare function renderWithOptions(options: RenderOptions, content: string | HTMLElement): HTMLElement;
/**
 * Parse the data contained within a PapyrosEvent using its contentType
 * Supported content types are: text/plain, text/json, img/png;base64
 * @param {PapyrosEvent} e Event containing data
 * @return {any} The parsed data
 */
export declare function parseEventData(e: PapyrosEvent): any;
export {};
