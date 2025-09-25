import { LogType, papyrosLog } from "./Logging";

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
export function downloadResults(data: string, filename: string): void {
    const blob = new Blob([data], { type: "text/plain" });
    const elem = window.document.createElement("a");
    // Cast URL to any as TypeScript doesn't recognize it properly
    // error TS2339: Property 'revokeObjectURL' does not exist on type
    const windowUrl = URL as any;
    elem.href = windowUrl.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
    windowUrl.revokeObjectURL(elem.href);
}

/**
 * Obtain the url of the current page without hashes, identifiers, query params, ...
 * @param {boolean} endingSlash Whether the url should end in a slash
 * @return {string} The current url
 */
export function cleanCurrentUrl(endingSlash = false): string {
    let url = location.origin + location.pathname;
    if (endingSlash && !url.endsWith("/")) {
        url += "/";
    } else if (!endingSlash && url.endsWith("/")) {
        url = url.slice(0, url.length - 1);
    }
    return url;
}

/**
 * Focus an element, setting the user's caret at the end of the contents
 * Needed to ensure focusing a contenteditable element works as expected
 * @param {HTMLElement} el The element to focus
 */
export function placeCaretAtEnd(el: HTMLElement): void {
     
    // Source: https://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser
    el.focus();
    if (typeof window.getSelection !== "undefined" &&
        typeof document.createRange !== "undefined") {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}

export function createDelayer(): (callback: () => void, ms: number) => void {
    let timer: any;
    return (callback, ms) => {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
}
