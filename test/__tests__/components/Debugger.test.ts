import { describe, expect, it } from "vitest";
import type { Frame } from "@dodona/trace-component/dist/trace_types";
import { Papyros } from "../../../src/frontend/state/Papyros";
import type { Debugger } from "../../../src/frontend/components/Debugger";
import "../../../src/frontend/components/Debugger";

function frame(line: number): Frame {
    return {
        line,
        event: "step_line",
        func_name: "<module>",
        globals: {},
        ordered_globals: [],
        stack_to_render: [],
        heap: {},
    };
}

describe("Debugger", () => {
    it("steps through the trace with the controls in its header bar", async () => {
        const element = document.createElement("p-debugger") as Debugger;
        element.papyros = new Papyros();
        document.body.append(element);
        element.papyros.debugger.active = true;
        element.papyros.debugger.trace = [frame(1), frame(2), frame(3)];
        await element.updateComplete;

        const stepper = element.shadowRoot!.querySelector<HTMLElement>(".stepper")!;
        expect(stepper.assignedSlot?.name).toBe("picker");
        expect(stepper.querySelector("output")!.textContent!.trim()).toBe("1 / 3");

        const [, , next] = stepper.querySelectorAll<HTMLElement>("md-icon-button");
        expect(next.ariaLabel).toBe("Next step");
        next.click();
        await element.updateComplete;
        expect(element.papyros.debugger.activeFrame).toBe(1);
        expect(stepper.querySelector("output")!.textContent!.trim()).toBe("2 / 3");
        expect(element.shadowRoot!.querySelector("tc-trace")!.selectedFrame).toBe(1);

        element.remove();
    });
});
