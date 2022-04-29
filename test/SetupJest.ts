// Polyfill for CodeMirror that uses createRange
window.document.createRange = () => ({
    setStart: () => {},
    setEnd: () => {},
    // eslint-disable-next-line
    commonAncestorContainer: {
        nodeName: 'BODY',
        ownerDocument: document,
    },
    getClientRects: () => []
} as any);

export {}
