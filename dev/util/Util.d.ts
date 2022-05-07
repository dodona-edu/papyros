import I18n from "i18n-js";
export declare const t: typeof I18n.t;
/**
 * Add the translations for Papyros to the I18n instance
 */
export declare function loadTranslations(): void;
export declare function getLocales(): Array<string>;
/**
 * Helper type to access a HTML element, either via its id or the element itself
 */
declare type ElementIdentifier = string | HTMLElement;
/**
 * Resolve an ElementIdentifier to the corresponding HTLMElement
 * @param {ElementIdentifier} elementId The identifier for the element
 * @return {T} The corresponding element
 */
export declare function getElement<T extends HTMLElement>(elementId: ElementIdentifier): T;
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
 * Parse the data contained within a PapyrosEvent using its contentType
 * Supported content types are: text/plain, text/json, img/png;base64
 * @param {string} data The data to parse
 * @param {string} contentType The content type of the data
 * @return {any} The parsed data
 */
export declare function parseData(data: string, contentType?: string): any;
export declare function downloadResults(data: string, filename: string): void;
/**
 * Obtain the url of the current page without hashes, identifiers, query params, ...
 * @param {boolean} endingSlash Whether the url should end in a slash
 * @return {string} The current url
 */
export declare function cleanCurrentUrl(endingSlash?: boolean): string;
export {};
