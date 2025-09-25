import { EditorView } from "@codemirror/view";
import {HighlightStyle, syntaxHighlighting} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import {Extension} from "@codemirror/state";

export const materialTheme = EditorView.theme({
    ".cm-scroller": { overflow: "auto" },
    "&": {
        height: "100%", // use full height of host
        width: "100%", // use full width of host
        "font-size": "14px", // use proper size to align gutters with editor
        backgroundColor: "var(--md-sys-color-surface-container-lowest)",
        color: "var(--md-sys-color-on-background)",
    },

    ".cm-gutters": {
        backgroundColor: "var(--md-sys-color-surface)",
        color: "var(--md-sys-color-on-surface-variant)",
        border: "none",
        fontSize: "12px",
    },

    ".cm-content": {
        color: "var(--md-sys-color-on-background)",
    },

    ".cm-activeLine, .cm-activeLineGutter": {
        backgroundColor: "color-mix(in srgb, var(--md-sys-color-surface-variant) 30%, transparent)",
    },

    "&.cm-focused": {
        outline: "none",
    },

    ".cm-selectionBackground": {
        backgroundColor: "var(--md-sys-color-surface-variant) !important",
    },

    ".cm-cursor, .cm-dropCursor": {
        borderLeft: "1.2px solid var(--md-sys-color-secondary) !important",
    },

    ".cm-tooltip": {
        backgroundColor: "var(--md-sys-color-surface)",
        border: "none",
        boxShadow: "0px 2px 6px rgba(0,0,0,0.2)",

        "& li[aria-selected]": {
            backgroundColor: "var(--md-sys-color-secondary)",
            color: "var(--md-sys-color-on-secondary)",
        },
    },

    ".cm-panels": {
        backgroundColor: "var(--md-sys-color-background)",
        color: "var(--md-sys-color-on-background)",
    },
    ".cm-panels.cm-panels-top": {
        borderBottom: "2px solid var(--md-sys-color-outline)",
    },
    ".cm-panels.cm-panels-bottom": {
        borderTop: "2px solid var(--md-sys-color-outline)",
    },

    ".cm-searchMatch": {
        backgroundColor: "color-mix(in srgb, var(--md-sys-color-secondary) 30%, transparent)",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: "color-mix(in srgb, var(--md-sys-color-surface-variant) 30%, transparent)",
        outline: "1px solid var(--md-sys-color-outline)",
    },
    ".cm-selectionMatch": {
        backgroundColor: "color-mix(in srgb, var(--md-sys-color-secondary) 30%, transparent)",
    },
    ".cm-button": {
        background: "var(--md-sys-color-surface-variant)",
        color: "var(--md-sys-color-on-surface-variant)",
        border: "none",
    },
    ".cm-button:hover": {
        background: "var(--md-sys-color-secondary)",
        color: "var(--md-sys-color-on-secondary)",
    },
    ".cm-textfield": {
        background: "var(--md-sys-color-surface-variant)",
        color: "var(--md-sys-color-on-surface-variant)",
        border: "none",
    },
    ".cm-textfield:focus": {
        outline: "none",
        border: "none",
        boxShadow: "0 0 0 2px var(--md-sys-color-primary)",
    },

}, { dark: false });

export const materialHighlight = HighlightStyle.define([
    // Comments
    { tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment], color: "var(--md-sys-color-on-surface-variant)" },

    // Keywords & operators
    { tag: [tags.keyword, tags.self, tags.controlKeyword, tags.operatorKeyword], color: "var(--md-sys-color-primary)" },
    { tag: [tags.definitionKeyword, tags.moduleKeyword], color: "var(--md-sys-color-primary)", fontStyle: "italic" },
    { tag: tags.atom, color: "var(--md-sys-color-secondary)" },
    { tag: tags.bool, color: "var(--md-sys-color-secondary)" },
    { tag: tags.operator, color: "var(--md-sys-color-primary)" },

    // Names
    { tag: tags.variableName, color: "var(--md-sys-color-on-background)" },
    { tag: tags.standard(tags.variableName), color: "var(--md-sys-color-tertiary)", fontStyle: "italic" },
    { tag: tags.function(tags.variableName), color: "var(--md-sys-color-tertiary)" },
    { tag: tags.typeName, color: "var(--md-sys-color-primary)" },
    { tag: tags.tagName, color: "var(--md-sys-color-primary)" },
    { tag: tags.attributeName, color: "var(--md-sys-color-tertiary)" },
    { tag: tags.className, color: "var(--md-sys-color-on-background)" },
    { tag: tags.labelName, color: "var(--md-sys-color-primary)", fontStyle: "italic" },
    { tag: tags.namespace, color: "var(--md-sys-color-on-background)" },

    // Literals
    { tag: tags.string, color: "var(--md-sys-color-tertiary)" },
    { tag: tags.number, color: "var(--md-sys-color-secondary)" },
    { tag: tags.regexp, color: "var(--md-sys-color-tertiary)" },

    // Emphasis / headings
    { tag: tags.emphasis, textDecoration: "underline" },
    { tag: tags.strong, fontWeight: "bold" },
    { tag: tags.strikethrough, textDecoration: "line-through" },
    { tag: tags.heading, fontWeight: "bold", color: "var(--md-sys-color-on-background)" },

    // Errors / diffs
    { tag: tags.invalid, color: "var(--md-sys-color-error)" },
    { tag: tags.deleted, color: "var(--md-sys-color-error)" },
    { tag: tags.inserted, color: "var(--md-sys-color-on-background)", fontWeight: "bold" },

    // Punctuation
    { tag: [tags.punctuation, tags.separator, tags.bracket], color: "var(--md-sys-color-on-background)" },
]);

export const material: Extension = [materialTheme, syntaxHighlighting(materialHighlight)];