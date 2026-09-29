import { LogType, papyrosLog } from "./Logging";

export function isValidFileName(name: string): boolean {
    if (!name) return false;
    if (name.startsWith("/") || name.endsWith("/")) return false;
    const segments = name.split("/");
    return segments.every((s) => s.length > 0 && s !== "." && s !== "..");
}

/** Whether `name` is valid and not taken by another file; `current` is the name being replaced, if any. */
export function isFileNameAvailable(name: string, files: { name: string }[], current?: string): boolean {
    return isValidFileName(name) && (name === current || !files.some((f) => f.name === name));
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

export type Debounced<T extends (...args: any[]) => void> = T & {
    /** Runs the pending call now, if there is one */
    flush(): void;
    /** Drops the pending call, if there is one */
    cancel(): void;
};

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): Debounced<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: Parameters<T> | undefined;
    const run = (): void => {
        clearTimeout(timer);
        const args = pending;
        pending = undefined;
        if (args) fn(...args);
    };
    const debounced = ((...args: Parameters<T>) => {
        clearTimeout(timer);
        pending = args;
        timer = setTimeout(run, delay);
    }) as Debounced<T>;
    debounced.flush = run;
    debounced.cancel = (): void => {
        clearTimeout(timer);
        pending = undefined;
    };
    return debounced;
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
