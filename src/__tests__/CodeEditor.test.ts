import { CodeEditor } from "../CodeEditor";


test("Editor can set and get code", () => {
    const initialCode = "print(input())";
    const editor = new CodeEditor(initialCode);
    expect(editor.getCode()).toBe(initialCode);
    const newCode = "import math\nx=math.sqrt(2)";
    editor.setCode(newCode);
    expect(editor.getCode()).toBe(newCode);
})
