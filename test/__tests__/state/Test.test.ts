import {test, expect} from "vitest";
import {Papyros} from "../../../src/Papyros";

test("testcode is appended to the end of the code", async () => {
    const papyros = new Papyros();
    await papyros.launch();
    papyros.runner.code = `1
2
3`;
    papyros.test.testCode = `4
5
6`;
    expect(papyros.runner.code).toBe(`1
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
    expect(papyros.runner.code).toBe(`foo

bar`);
    expect(papyros.test.testLineCount).toBe(1);
    papyros.test.editTestCode();
    expect(papyros.runner.code).toBe(`foo

bar`);
    expect(papyros.test.testLineCount).toBe(undefined);
});

test("should be able to get testfreeCode", async () => {
    const papyros = new Papyros();
    await papyros.launch();
    papyros.runner.code = "foo";
    expect(papyros.test.testfreeCode).toBe("foo");
    papyros.test.testCode = "bar\nbaz";
    expect(papyros.test.testfreeCode).toBe("foo\n");
});

test("Setting new testCode removes old testCode", async () => {
    const papyros = new Papyros();
    await papyros.launch();
    papyros.runner.code = "foo";
    papyros.test.testCode = "bar\nbaz";
    expect(papyros.runner.code).toBe(`foo

bar
baz`);
    papyros.test.testCode = "qux";
    expect(papyros.runner.code).toBe(`foo


qux`);
});

test("Setting undefined testCode removes old testCode", async () => {
    const papyros = new Papyros();
    await papyros.launch();
    papyros.runner.code = "foo";
    papyros.test.testCode = "bar\nbaz";
    expect(papyros.runner.code).toBe(`foo

bar
baz`);
    papyros.test.testCode = undefined;
    expect(papyros.runner.code).toBe("foo\n");
});