import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { UsedInputGutters, UsedInputGutterInfo } from "./Gutters";

/**
 * Editor to handle and highlight user input
 */
export class BatchInputEditor extends CodeMirrorEditor {
    /**
     * Style classes used to highlight lines
     */
    private static HIGHLIGHT_CLASSES = ["cm-activeLine"];
    /**
     * Gutters to show which lines were used
     */
    private usedInputGutters: UsedInputGutters;

    constructor() {
        super(new Set([CodeMirrorEditor.PLACEHOLDER, CodeMirrorEditor.STYLE]), {
            classes: ["papyros-input-editor", "_tw-overflow-auto",
                "_tw-border-solid", "_tw-border-gray-200", "_tw-border-2", "_tw-rounded-lg",
                "dark:_tw-bg-dark-mode-bg", "dark:_tw-border-dark-mode-content",
                "focus:_tw-outline-none", "focus:_tw-ring-1", "focus:_tw-ring-blue-500"],
            minHeight: "10vh",
            maxHeight: "20vh"
        }
        );
        this.usedInputGutters = new UsedInputGutters();
        this.addExtension(this.usedInputGutters.toExtension());
    }

    /**
     * Apply highlighting to the lines in the Editor
     * @param {function(number): UsedInputGutterInfo} getInfo Function to obtain gutter
     * info per line (1-based indexing)
     */
    public highlight(getInfo: (lineNr: number) => UsedInputGutterInfo): void {
        this.editorView.dom.querySelectorAll(".cm-line").forEach((line, i) => {
            const info = getInfo(i + 1);
            BatchInputEditor.HIGHLIGHT_CLASSES.forEach(c => {
                line.classList.toggle(c, info.on);
            });
            this.usedInputGutters.setMarker(this.editorView, info);
        });
    }

    /**
     * @return {Array<string>} Array of valid user input
     * Data in the last line that is not terminated by a newline is omitted
     */
    public getLines(): Array<string> {
        const lines = [];
        // Always need to call next atleast once
        // Use iter to have line-separating information
        let lineIterator = this.editorView.state.doc.iter().next();
        while (!lineIterator.done) {
            lines.push(lineIterator.value);
            lineIterator = lineIterator.next();
        }
        // Filter lines based on presence of line separators
        let last = lines.length - 1;
        while (last >= 0) {
            const removed = lines.splice(last, 1)[0];
            if (removed === "\n") { // Line followed by separator
                last -= 2;
            } else { // Last line without separator, omit it
                last -= 1;
            }
        }
        return lines;
    }
}
