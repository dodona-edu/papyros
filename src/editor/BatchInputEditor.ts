import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { UsedInputGutters, UsedInputGutterInfo } from "./Gutters";
import { keymap, ViewUpdate } from "@codemirror/view";
import { insertNewline } from "@codemirror/commands";

/**
 * Arguments used to higlight lines in the Editor
 */
interface HighlightArgs {
    /**
     * Whether the user's code is currently running and using input
     */
    running: boolean;
    /**
     * Function to obtain gutter info per line (1-based indexing)
     */
    getInfo: (lineInfo: number) => UsedInputGutterInfo;
}
/**
 * Editor to handle and highlight user input
 */
export class BatchInputEditor extends CodeMirrorEditor {
    /**
     * Gutters to show which lines were used
     */
    private usedInputGutters: UsedInputGutters;
    private lastHighlightArgs?: HighlightArgs;

    constructor() {
        super(new Set([CodeMirrorEditor.PLACEHOLDER, CodeMirrorEditor.STYLE]), {
            classes: ["papyros-input-editor", "_tw-overflow-auto",
                "_tw-border-solid", "_tw-border-gray-200", "_tw-border-2", "_tw-rounded-lg",
                "dark:_tw-bg-dark-mode-bg", "dark:_tw-border-dark-mode-content",
                "focus:_tw-outline-none", "focus:_tw-ring-1", "focus:_tw-ring-blue-500"],
            minHeight: "10vh",
            maxHeight: "20vh",
            theme: {}
        });
        this.usedInputGutters = new UsedInputGutters();
        this.addExtension(this.usedInputGutters.toExtension());
        this.addExtension([
            keymap.of([
                {
                    key: "Enter", run: insertNewline
                }
            ]),
        ]);
    }

    private getLastHighlightArgs(): HighlightArgs {
        return this.lastHighlightArgs || {
            running: false,
            getInfo: lineNr => {
                return {
                    lineNr,
                    on: false,
                    title: ""
                };
            }
        };
    }

    protected override onViewUpdate(v: ViewUpdate): void {
        super.onViewUpdate(v);
        // Ensure that highlighting occurs after CodeMirrors internal update
        // so that the style classes are not overwritten
        setTimeout(() => {
            this.highlight(this.getLastHighlightArgs());
        }, 10);
    }

    /**
     * Apply highlighting to the lines in the Editor
     * @param {HightlightArgs} args Arguments for highlighting
     * @param {Array<string>} highlightClasses HTML classes to use for consumed lines
     */
    public highlight(args: HighlightArgs,
        highlightClasses = ["_tw-bg-slate-200", "dark:_tw-bg-slate-500"]): void {
        this.lastHighlightArgs = args;
        const {
            running, getInfo
        } = args;
        let nextLineToUse = 0;
        this.editorView.dom.querySelectorAll(".cm-line").forEach((line, i) => {
            const info = getInfo(i + 1);
            if (info.on) {
                nextLineToUse += 1;
            }
            line.classList.toggle("cm-activeLine", running && i === nextLineToUse);
            highlightClasses.forEach(className => {
                line.classList.toggle(className, i !== nextLineToUse && info.on);
            });
            line.setAttribute("contenteditable", "" + (!running || !info.on));
            this.usedInputGutters.setMarker(this.editorView, info);
        });
    }

    /**
     * @return {Array<string>} Array of valid user input
     * Data in the last line that is not terminated by a newline is omitted
     */
    public getLines(): Array<string> {
        const lines = this.editorView.state.doc.toString().split("\n");
        return lines.slice(0, lines.length - 1);
    }
}
