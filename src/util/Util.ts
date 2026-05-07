import { LogType, papyrosLog } from "./Logging";

export function isValidFileName(name: string): boolean {
    if (!name) return false;
    if (name.startsWith("/") || name.endsWith("/")) return false;
    const segments = name.split("/");
    return segments.every((s) => s.length > 0 && s !== "." && s !== "..");
}

const TEXT_MIME_PATTERNS = ["text/", "application/json", "application/xml", "application/javascript"];

export function isTextMimeType(mime: string | null | undefined): boolean {
    if (!mime) {
        // No MIME type — assume text
        return true;
    }
    // Strip parameters like "; charset=utf-8" before matching
    const base = mime.split(";")[0].trim().toLowerCase();
    return TEXT_MIME_PATTERNS.some((prefix) => base.startsWith(prefix));
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const CHUNK = 8192;
    const chunks: string[] = [];
    for (let i = 0; i < bytes.length; i += CHUNK) {
        chunks.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)));
    }
    return btoa(chunks.join(""));
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
 * Supported content types are: text/plain, text/json, image/png;base64
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
        case "image": {
            switch (specificType) {
                case "png;base64":
                case "svg+xml;base64": {
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
