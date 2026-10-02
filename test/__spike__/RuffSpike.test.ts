import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Papyros } from "../../src/frontend/state/Papyros";
import { ProgrammingLanguage } from "../../src/ProgrammingLanguage";
import { Linter, WorkerDiagnostic } from "../../src/backend/Backend";
import { launchPapyros } from "../helpers";
import { PYTHON_EXAMPLES } from "../../src/frontend/components/app/examples/PythonExamples";

/**
 * Measurements for the ruff spike (SPIKE-RUFF.md). Skipped unless VITE_RUFF_SPIKE=1,
 * because it lints every sample ten times and prints JSON rather than asserting much:
 *
 *   VITE_RUFF_SPIKE=1 npx vitest run --exclude ".claude/**" test/__spike__
 */

const RUNS = 5;

const LONG_SAMPLE = `import math
import random


class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
        self.history = []

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("amount must be positive")
        self.balance += amount
        self.history.append(("deposit", amount))

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount
        self.history.append(("withdraw", amount))

    def statement(self):
        lines = [f"Statement for {self.owner}"]
        for kind, amount in self.history:
            lines.append(f"  {kind:<10} {amount:>8.2f}")
        lines.append(f"  balance    {self.balance:>8.2f}")
        return "\\n".join(lines)


class Bank:
    def __init__(self):
        self.accounts = {}

    def open(self, owner, balance=0):
        if owner in self.accounts:
            raise KeyError(f"{owner} already has an account")
        account = Account(owner, balance)
        self.accounts[owner] = account
        return account

    def transfer(self, source, target, amount):
        self.accounts[source].withdraw(amount)
        self.accounts[target].deposit(amount)

    def richest(self):
        return max(self.accounts.values(), key=lambda a: a.balance)

    def total(self):
        return sum(a.balance for a in self.accounts.values())


def interest(balance, rate, years):
    return balance * math.pow(1 + rate, years)


def simulate(bank, days, seed=42):
    random.seed(seed)
    owners = list(bank.accounts)
    for _ in range(days):
        source, target = random.sample(owners, 2)
        amount = round(random.uniform(1, 50), 2)
        try:
            bank.transfer(source, target, amount)
        except ValueError:
            pass


def histogram(values, width=40):
    top = max(values)
    rows = []
    for value in values:
        bar = "#" * int(width * value / top)
        rows.append(f"{value:>8.2f} {bar}")
    return "\\n".join(rows)


def main():
    bank = Bank()
    for name in ["Alice", "Bob", "Claire", "Dave"]:
        bank.open(name, random.randint(50, 200))
    simulate(bank, 100)
    for account in bank.accounts.values():
        print(account.statement())
        print()
    print("Richest:", bank.richest().owner)
    print("Total:", bank.total())
    print(histogram([a.balance for a in bank.accounts.values()]))
    print("In ten years:", round(interest(bank.total(), 0.03, 10), 2))


if __name__ == "__main__":
    main()
`;

const MISTAKES: Record<string, string> = {
    "unused variable in a function": "def f():\n    unused = 1\n    return 2\n",
    "unused import": "import os\nprint(1)\n",
    "undefined name": "print(undefined_name)\n",
    "x = x": "x = 1\nx = x\n",
    "x += 0": "x = 1\nx += 0\nprint(x)\n",
    "if True:": "if True:\n    print(1)\n",
    "missing str method": "s = 'abc'\nprint(s.uppercase())\n",
    "from os import nope": "from os import nope\nprint(nope)\n",
    "missing docstring": "def f(x):\n    return x + 1\n",
    "bad name foo": "def foo():\n    return 1\n",
    "syntax error": "print 'hello'\n",
    "statement without effect": "x = 1\ny = 2\nprint\n",
    "comparison with None": "x = None\nif x == None:\n    print(1)\n",
    "mutable default": "def f(a=[]):\n    a.append(1)\n    return a\n",
    "shadowed builtin": "list = [1, 2]\nprint(list)\n",
};

const SAMPLES: Record<string, string> = {
    ...Object.fromEntries(Object.entries(PYTHON_EXAMPLES).map(([name, code]) => [`example: ${name}`, code])),
    "long sample (~100 lines)": LONG_SAMPLE,
    ...Object.fromEntries(Object.entries(MISTAKES).map(([name, code]) => [`mistake: ${name}`, code])),
};

interface Run {
    install: number;
    lint: number;
    roundTrip: number;
}

interface Result {
    sample: string;
    lines: number;
    pylint: { runs: Run[]; diagnostics: WorkerDiagnostic[] };
    ruff: { runs: Run[]; diagnostics: WorkerDiagnostic[] };
}

describe.skipIf(!import.meta.env.VITE_RUFF_SPIKE)("ruff spike", () => {
    let papyros: Papyros;

    beforeAll(async () => {
        papyros = await launchPapyros(ProgrammingLanguage.Python);
    }, 180000);

    afterAll(() => papyros.dispose());

    async function lint(linter: Linter, code: string): Promise<{ run: Run; diagnostics: WorkerDiagnostic[] }> {
        papyros.runner.linter = linter;
        papyros.runner.code = code;
        const start = performance.now();
        const diagnostics = await papyros.runner.lintSource();
        const roundTrip = performance.now() - start;
        const proxy: any = (await papyros.runner.backend).workerProxy;
        const timings = await proxy.getLintTimings();
        return { run: { ...timings.last, roundTrip }, diagnostics };
    }

    for (const [sample, code] of Object.entries(SAMPLES)) {
        it(`measures ${sample}`, async () => {
            const result: Result = {
                sample,
                lines: code.split("\n").length,
                pylint: { runs: [], diagnostics: [] },
                ruff: { runs: [], diagnostics: [] },
            };
            for (const linter of ["pylint", "ruff"] as Linter[]) {
                for (let i = 0; i < RUNS; i++) {
                    const { run, diagnostics } = await lint(linter, code);
                    result[linter].runs.push(run);
                    result[linter].diagnostics = diagnostics;
                }
            }
            console.log("SPIKE_JSON " + JSON.stringify(result));
            expect(result.ruff.runs).toHaveLength(RUNS);
        }, 300000);
    }
});
