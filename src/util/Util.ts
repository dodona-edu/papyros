import { LogType, papyrosLog } from "./Logging";

export function isValidFileName(name: string): boolean {
    if (!name) return false;
    if (name.startsWith("/") || name.endsWith("/")) return false;
    const segments = name.split("/");
    return segments.every((s) => s.length > 0 && s !== "." && s !== "..");
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    let timer: ReturnType<typeof setTimeout> | undefined;
    return ((...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    }) as T;
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
