import { RangeSet } from "@codemirror/rangeset";
import { Extension, StateEffect, StateField } from "@codemirror/state";
import { gutter, GutterMarker } from "@codemirror/gutter";
import {
    EditorView,
}
    from "@codemirror/view";
export function breakpoints(onToggle: (pos: number, value: boolean) => void): Extension {
    const breakpointEffect = StateEffect.define<{ pos: number, on: boolean }>({
        map: (val, mapping) => ({ pos: mapping.mapPos(val.pos), on: val.on })
    });

    const breakpointState = StateField.define<RangeSet<GutterMarker>>({
        create() {
            return RangeSet.empty;
        },
        update(set, transaction) {
            let returnSet = set.map(transaction.changes);
            for (const e of transaction.effects) {
                if (e.is(breakpointEffect)) {
                    if (e.value.on) {
                        returnSet = returnSet.update(
                            { add: [breakpointMarker.range(e.value.pos)] }
                        );
                    } else {
                        returnSet = returnSet.update({ filter: from => from != e.value.pos });
                    }
                }
            }
            return returnSet;
        }
    });

    function toggleBreakpoint(view: EditorView, pos: number): void {
        const breakpoints = view.state.field(breakpointState);
        let hasBreakpoint = false;
        breakpoints.between(pos, pos, () => {
            hasBreakpoint = true;
        });
        onToggle(pos, !hasBreakpoint);
        view.dispatch({
            effects: breakpointEffect.of({ pos, on: !hasBreakpoint })
        });
    }

    const breakpointMarker = new class extends GutterMarker {
        toDOM(): Text {
            return document.createTextNode("🔴");
        }
    };

    return [
        breakpointState,
        gutter({
            class: "cm-breakpoint-gutter",
            markers: v => v.state.field(breakpointState),
            initialSpacer: () => breakpointMarker,
            domEventHandlers: {
                mousedown(view, line) {
                    toggleBreakpoint(view, line.from);
                    return true;
                }
            }
        }),
        EditorView.baseTheme({
            ".cm-breakpoint-gutter .cm-gutterElement": {
                color: "red",
                paddingLeft: "5px",
                cursor: "default"
            }
        })
    ];
}
