import { ProgrammingLanguage } from "../../src/ProgrammingLanguage";
import { BackendManager } from "../../src/communication/BackendManager";
// eslint-disable-next-line jest/no-mocks-import
import { MockBackend } from "../__mocks__/MockBackend";
import { describe, expect, it } from "vitest";

describe("BackendManager", () => {
    it("can register a backend", () => {
        BackendManager.registerBackend(ProgrammingLanguage.JavaScript, () => {
            return { workerProxy: new MockBackend() } as any;
        });
        expect(BackendManager.createBackend(ProgrammingLanguage.JavaScript)).toBeTruthy();
    });

    it("creates a fresh client per call", () => {
        BackendManager.registerBackend(ProgrammingLanguage.JavaScript, () => {
            return { workerProxy: new MockBackend() } as any;
        });
        const first = BackendManager.createBackend(ProgrammingLanguage.JavaScript);
        const second = BackendManager.createBackend(ProgrammingLanguage.JavaScript);
        expect(first).not.toBe(second);
    });

    it("can remove a backend", () => {
        BackendManager.registerBackend(ProgrammingLanguage.JavaScript, () => {
            return { workerProxy: new MockBackend() } as any;
        });
        expect(BackendManager.removeBackend(ProgrammingLanguage.JavaScript)).toEqual(true);
        expect(() => BackendManager.createBackend(ProgrammingLanguage.JavaScript)).toThrow("not yet supported");
    });
});
