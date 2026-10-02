import { describe, expect, it } from "vitest";
import type { Diagnostic } from "@astral-sh/ruff-wasm-web";
import { severityOf, toWorkerDiagnostics } from "../../src/backend/workers/python/ruff";

const ruffDiagnostic = (fields: Partial<Diagnostic>): Diagnostic => ({
    code: "F841",
    message: "Local variable `y` is assigned to but never used",
    tags: [],
    annotations: [],
    subDiagnostics: [],
    start_location: { row: 4, column: 5 },
    end_location: { row: 4, column: 6 },
    fix: null,
    ...fields,
});

describe("toWorkerDiagnostics", () => {
    it("shifts ruff's 1-based columns to 0-based and keeps the rule id", () => {
        const [diagnostic] = toWorkerDiagnostics([ruffDiagnostic({})]);
        expect(diagnostic).toEqual({
            lineNr: 4,
            columnNr: 4,
            endLineNr: 4,
            endColumnNr: 5,
            severity: "error",
            message: "Local variable `y` is assigned to but never used",
            code: "F841",
        });
    });

    it("reports a syntax error as an error without a rule id", () => {
        const syntaxError = ruffDiagnostic({
            code: "invalid-syntax",
            message: "Simple statements must be separated by newlines or semicolons",
            start_location: { row: 1, column: 7 },
            end_location: { row: 1, column: 14 },
        });
        const [diagnostic] = toWorkerDiagnostics([syntaxError, ruffDiagnostic({ code: null })]);
        expect(diagnostic.severity).toBe("error");
        expect(diagnostic.code).toBeUndefined();
        expect(diagnostic.lineNr).toBe(1);
        expect(diagnostic.columnNr).toBe(6);
        expect(toWorkerDiagnostics([ruffDiagnostic({ code: null })])[0].code).toBeUndefined();
    });

    it("derives the severity from the rule prefix", () => {
        expect(severityOf("F821")).toBe("error");
        expect(severityOf("E902")).toBe("error");
        expect(severityOf("PLE1142")).toBe("error");
        expect(severityOf("W605")).toBe("warning");
        expect(severityOf("PLW0127")).toBe("warning");
        expect(severityOf("E702")).toBe("info");
        expect(severityOf("PLR1714")).toBe("info");
    });
});
