// Based on https://github.com/codemirror/theme-one-dark/blob/main/src/one-dark.ts with slight edits
import { EditorView } from "@codemirror/view";

// Using https://github.com/one-dark/vscode-one-dark-theme/ as reference for the colors

const ivory = "#abb2bf";
const stone = "#7d8799"; // Brightened compared to original to increase contrast
const darkBackground = "#21252b";
const highlightBackground = "#2c313a";
const background = "#282c34";
const tooltipBackground = "#353a42";
const selection = "#3E4451";
const cursor = "#528bff";

// / The editor theme styles
export const darkTheme = EditorView.theme({
    "&": {
        color: ivory,
        backgroundColor: background
    },

    ".cm-content": {
        caretColor: cursor
    },

    ".cm-cursor, .cm-dropCursor": { borderLeftColor: cursor },
    // eslint-disable-next-line max-len
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": { backgroundColor: selection },

    ".cm-panels": { backgroundColor: darkBackground, color: ivory },
    ".cm-panels.cm-panels-top": { borderBottom: "2px solid black" },
    ".cm-panels.cm-panels-bottom": { borderTop: "2px solid black" },

    ".cm-searchMatch": {
        backgroundColor: "#72a1ff59",
        outline: "1px solid #457dff"
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: "#6199ff2f"
    },

    ".cm-activeLine": { backgroundColor: highlightBackground },
    ".cm-selectionMatch": { backgroundColor: "#aafe661a" },

    "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
        backgroundColor: "#bad0f847",
        outline: "1px solid #515a6b"
    },

    ".cm-gutters": {
        // make gutters darker
        backgroundColor: darkBackground,
        color: stone,
        border: "none"
    },

    ".cm-activeLineGutter": {
        backgroundColor: highlightBackground
    },

    ".cm-foldPlaceholder": {
        backgroundColor: "transparent",
        border: "none",
        color: "#ddd"
    },

    ".cm-tooltip": {
        border: "none",
        backgroundColor: tooltipBackground
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
        borderTopColor: "transparent",
        borderBottomColor: "transparent"
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
        borderTopColor: tooltipBackground,
        borderBottomColor: tooltipBackground
    },
    ".cm-tooltip-autocomplete": {
        "& > ul > li[aria-selected]": {
            backgroundColor: highlightBackground,
            color: ivory
        }
    }
}, { dark: true });
