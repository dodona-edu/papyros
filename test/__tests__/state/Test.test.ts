import {test, expect} from "vitest";
import {Papyros} from "../../../src/frontend/state/Papyros";

test("testcode is appended to the end of the code", async () => {
    const papyros = new Papyros();
    await papyros.launch();
    papyros.runner.code = `1
2
3`;
    papyros.test.testCode = `4
5
6`;
    expect(papyros.runner.effectiveCode).toBe(`1
2
3

4
5
6`);
});

test("editTestCode leaves code as normal code", async () => {
    const papyros = new Papyros();
    await papyros.launch();
    papyros.runner.code = "foo";
    papyros.test.testCode = "bar";
    expect(papyros.runner.effectiveCode).toBe(`foo

bar`);
    papyros.test.editTestCode();
    expect(papyros.runner.code).toBe(`foo

bar`);
    expect(papyros.test.testCode).toBe(undefined);
});

test("setting effectiveCode correctly passes changes through to code", async () => {
    const papyros = new Papyros();
    await papyros.launch();
    papyros.runner.code = "foo";
    papyros.test.testCode = "bar";
    expect(papyros.runner.effectiveCode).toBe(`foo

bar`);
    papyros.runner.effectiveCode = `baz

bar`;
    expect(papyros.runner.code).toBe("baz");
    expect(papyros.test.testCode).toBe("bar");
})