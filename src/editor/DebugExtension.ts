import { Decoration, EditorView } from "@codemirror/view";
import { LineEffectExtension } from "./LineEffectExtension";
import { DebugLineGutter } from "./Gutters";
import { Extension } from "@codemirror/state";
import { BackendManager } from "../BackendManager";
import { BackendEventType } from "../BackendEvent";

const activeLineDecoration = Decoration.line({ class: "cm-activeLine" });

export class DebugExtension {
    private readonly view: EditorView;
    private readonly gutter: DebugLineGutter;
    private readonly lineEffect: LineEffectExtension;


    constructor(view: EditorView) {
        this.view = view;
        this.gutter = new DebugLineGutter();
        this.lineEffect = new LineEffectExtension(view);

        BackendManager.subscribe(BackendEventType.FrameChange, e => {
            const line = e.data.line;
            this.markLine(line);
        });
    }

    public toggle(show: boolean): void {
        this.gutter.toggle(show);
        this.lineEffect.clear();

        if (show) {
            this.markLine(1);
        }
    }

    public markLine(lineNr: number): void {
        this.gutter.markLine(this.view, lineNr);
        this.lineEffect.set([activeLineDecoration.range(this.view.state.doc.line(lineNr).from)]);
        this.view.dispatch({
            effects: EditorView.scrollIntoView(this.view.state.doc.line(lineNr).from)
        });
    }

    public toExtension(): Extension {
        return [this.lineEffect.toExtension(), this.gutter.toExtension()];
    }
}
