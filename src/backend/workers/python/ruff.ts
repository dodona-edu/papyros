import type { Diagnostic } from "@astral-sh/ruff-wasm-web";
import { WorkerDiagnostic } from "../../Backend";

/**
 * Ruff's code for a parse error; the typings still describe it as null
 */
const SYNTAX_ERROR_CODE = "invalid-syntax";

/**
 * Rule set that mirrors pylint_config.rc as far as ruff allows. PLR0902 and PLR0903
 * (too-many-instance-attributes, too-few-public-methods) are preview rules in ruff
 * and cannot be named without preview mode, so they are absent rather than ignored.
 */
export const RUFF_OPTIONS = {
    "target-version": "py314",
    "line-length": 120,
    lint: {
        select: ["E", "W", "F", "PL"],
        ignore: [
            "E501", // C0301 line-too-long
            "W291", // C0303 trailing-whitespace
            "W292", // C0304 missing-final-newline
            "E402", // C0413 wrong-import-position
            "PLR0904", // R0904 too-many-public-methods
            "PLR0911", // R0911 too-many-return-statements
            "PLR2004", // magic-value-comparison, noise for beginners
        ],
        "dummy-variable-rgx": "^_$",
    },
};

/**
 * Prefixes that decide the severity, longest match first. Ruff attaches no severity
 * to a diagnostic, so this is a provisional table until a shared message catalogue
 * settles it.
 */
const SEVERITIES: Array<[string, WorkerDiagnostic["severity"]]> = [
    ["PLE", "error"],
    ["PLW", "warning"],
    ["E9", "error"],
    ["F", "error"],
    ["W", "warning"],
    ["B", "warning"],
];

export function severityOf(code: string | null): WorkerDiagnostic["severity"] {
    if (code === null || code === SYNTAX_ERROR_CODE) {
        return "error";
    }
    return SEVERITIES.find(([prefix]) => code.startsWith(prefix))?.[1] ?? "info";
}

/**
 * Map ruff's diagnostics onto the shape the editor expects. Ruff reports 1-based
 * rows and columns with an exclusive end, in UTF-16 units when the workspace uses
 * that encoding, which matches CodeMirror's offsets after the column shift.
 * @param {Array<Diagnostic>} diagnostics What ruff's Workspace.check returned
 * @return {Array<WorkerDiagnostic>} The same issues as worker diagnostics
 */
export function toWorkerDiagnostics(diagnostics: Array<Diagnostic>): Array<WorkerDiagnostic> {
    return diagnostics.map((d) => {
        const isSyntaxError = d.code === null || d.code === SYNTAX_ERROR_CODE;
        return {
            lineNr: d.start_location.row,
            columnNr: d.start_location.column - 1,
            endLineNr: d.end_location.row,
            endColumnNr: d.end_location.column - 1,
            severity: severityOf(d.code),
            message: d.message,
            code: isSyntaxError ? undefined : (d.code ?? undefined),
        };
    });
}
