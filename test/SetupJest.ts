import nodeCrypto from "crypto";

// Polyfill for CodeMirror that uses createRange
window.document.createRange = () => ({
    setStart: () => { },
    setEnd: () => { },
    // eslint-disable-next-line
    commonAncestorContainer: {
        nodeName: 'BODY',
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

// Mocks for Worker specific methods
window.importScripts = (...urls: (string | URL)[]) => {}
(window as any).loadPyodide = () => new Object();

export { }
