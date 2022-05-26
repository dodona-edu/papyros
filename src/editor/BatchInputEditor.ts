import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { UsedInputGutters, UsedInputGutterInfo } from "./Gutters";

export class BatchInputEditor extends CodeMirrorEditor {
    private static HIGHLIGHT_CLASSES = ["cm-activeLine"];// "_tw-bg-sky-200", "_tw-text-white"];
    private usedInputGutters: UsedInputGutters;

    constructor() {
        super(["placeholder"], {
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

    public highlight(getInfo: (lineNr: number) => UsedInputGutterInfo): void {
        this.editorView.dom.querySelectorAll(".cm-line").forEach((line, i) => {
            const info = getInfo(i + 1);
            BatchInputEditor.HIGHLIGHT_CLASSES.forEach(c => {
                line.classList.toggle(c, info.on);
            });
            this.usedInputGutters.setMarker(this.editorView, info);
        });
    }

    public getLines(): Array<string> {
        const lines = [];
        // Always need to call next atleast once
        let lineIterator = this.editorView.state.doc.iterLines().next();
        while (!lineIterator.done) {
            lines.push(lineIterator.value);
            lineIterator = lineIterator.next();
        }
        if (lines.length > 0 && lines[lines.length - 1] === "") {
            // Don't count last line as actual input
            lines.splice(lines.length - 1, 1);
        }
        return lines;
    }
}
