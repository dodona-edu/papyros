import { describe, expect, it } from "vitest";
import { DUTCH_TRANSLATION, ENGLISH_TRANSLATION } from "../../../src/frontend/state/Translations";
import type { CodeEditor } from "../../../src/frontend/components/code_mirror/CodeEditor";
import "../../../src/frontend/components/code_mirror/CodeEditor";

describe("CodeEditor", () => {
    it("describes how to leave the editor on the editable content", async () => {
        const element = document.createElement("p-code-editor") as CodeEditor;
        element.translations = ENGLISH_TRANSLATION.CodeMirror;
        document.body.append(element);
        await element.updateComplete;

        const shadowRoot = element.shadowRoot!;
        const content = shadowRoot.querySelector(".cm-content")!;
        const hintId = content.getAttribute("aria-describedby")!;
        expect(hintId).toBeTruthy();

        const hint = shadowRoot.getElementById(hintId);
        expect(hint?.textContent).toBe("Press Escape followed by Tab to leave the code editor.");

        element.translations = DUTCH_TRANSLATION.CodeMirror;
        await element.updateComplete;
        expect(hint?.textContent).toBe("Druk op Escape en daarna Tab om de code-editor te verlaten.");

        element.remove();
    });
});
