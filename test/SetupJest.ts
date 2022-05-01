import nodeCrypto from "crypto";
import { TextDecoder } from "util";
// Polyfill for CodeMirror that uses createRange
window.document.createRange = () => ({
    setStart: () => {
        // nothing
    },
    setEnd: () => {
        // nothing
    },
    // eslint-disable-next-line
    commonAncestorContainer: {
        nodeName: "BODY",
        ownerDocument: document,
    },
    getClientRects: () => []
} as any);

// Mock for crypto used in sync-message
window.crypto = {
    getRandomValues: function (buffer: any) {
        return nodeCrypto.randomFillSync(buffer);
    },
} as any;

// Mock TextDecoder
(window as any).TextDecoder = TextDecoder;

// Mock URL methods
(window.URL as any).createObjectURL = jest.fn();
(window.URL as any).revokeObjectURL = jest.fn();

// Mocks for Worker specific methods
window.importScripts = () => {
    // Empty mock
};
(window as any).loadPyodide = () => {
    return {};
};

export { };
