import { arrayBufferToBase64 } from "../../util/Util";
import { FileEntry } from "./InputOutput";

// ignoreBOM keeps a byte order mark in the text, so a run reads the file's exact bytes.
const utf8Decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

const loadedFiles = new Map<string, Promise<FileEntry>>();

/** The decoded last path segment of a URL */
export function fileNameFromUrl(url: string): string {
    const segment = new URL(url).pathname.split("/").pop() ?? "";
    try {
        return decodeURIComponent(segment);
    } catch {
        return segment;
    }
}

async function fetchFile(url: string): Promise<FileEntry> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const name = fileNameFromUrl(url);
    try {
        return { name, content: utf8Decoder.decode(buffer), binary: false };
    } catch {
        return { name, content: arrayBufferToBase64(buffer), binary: true };
    }
}

/**
 * Fetches a file once per absolute URL: later calls share the first result. A failed
 * load is forgotten, so calling again retries. Text is kept as is, anything that is not
 * valid UTF-8 comes back base64-encoded and flagged binary.
 */
export function loadFile(url: string): Promise<FileEntry> {
    let file = loadedFiles.get(url);
    if (!file) {
        file = fetchFile(url);
        loadedFiles.set(url, file);
        file.catch(() => loadedFiles.delete(url));
    }
    return file;
}
