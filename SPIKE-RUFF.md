# Spike: ruff-wasm as an optional linter in papyros

Branch `feat/ruff-linter-spike`, measured 2026-09-13 on an Apple Silicon Mac in headless
Chromium (vitest browser mode, Playwright) and in the vite dev server. Ruff is
`@astral-sh/ruff-wasm-web` 0.16.7, pylint is 4.0.7 with astroid 4.0.4 inside Pyodide
314.0.6 (Python 3.14). Pylint stays the default; ruff is selected per `Runner.linter`
(`papyros.runner.linter = "ruff"`) or `?linter=ruff` on the demo page.

## Summary

- Ruff works inside the existing Python worker, in the dev server and in the vitest browser
  tests. It loads in parallel with Pyodide and needs no pip install of the code's imports.
- Warm lint latency: pylint 20 to 55 ms per lint on the samples, ruff 0.1 to 0.3 ms. Both
  are well under a keystroke, so latency alone does not decide this. What pylint adds on
  top is a 0.7 s first lint, a 1 s import install for matplotlib even when cached, and
  seconds of download on a cold cache.
- Ruff is ready about 70 ms after the worker starts, Pyodide plus micropip
  about 2,700 ms. Today `Runner.lintSource()` waits for the whole launch, so the
  editor sees the same time to first lint for both; the gap is what a changed launch
  handshake could win.
- Payload: the ruff wasm is 10.9 MB raw, 3.8 MB gzip, 2.6 MB brotli. Pylint, astroid and
  their dependencies are 1.1 MB of the 1.57 MB Python tarball (gzip). Moving to ruff adds
  about 1.5 MB (brotli) to a cold load and removes nothing until pylint leaves the tarball.
- Diagnostics: for the plain mistakes (unused import, unused variable, undefined name,
  `x = x`, `== None`) the two agree. Pylint alone reports the inference based checks
  (no-member, no-name-in-module, useless increment, constant condition, dangerous default,
  statement without effect, disallowed names) and gives the friendlier syntax error
  message. Ruff alone reports semicolons and whitespace on blank lines. Section 5 has the
  full tables.

## 1. Does it work

| where | result |
|---|---|
| vitest browser tests | `test/__tests__/state/Runner.test.ts` "with ruff": undefined name (F821, right line and 0-based column), syntax error (error, no code), `import sympy` lints in under a second without a pip download. All 202 existing tests stay green. |
| unit test | `test/__tests__/RuffDiagnostics.test.ts` covers the position shift, the severity table and the syntax error mapping without a worker. |
| dev server | `?linter=ruff` with `import re` and `x = undefined_name`: F401 and F821 as errors, underlined in the editor, listed with their rule id in the lint panel (Mod-Shift-m). `loadingPackages` stayed empty; the only wasm and wheel requests were `ruff_wasm_bg.wasm` (200, `application/wasm`), `pyodide.asm.wasm` and the micropip wheel Pyodide preloads. Same page without the parameter gives pylint's two messages without codes. |
| library build | `yarn build:lib` succeeds; `dist/` has the tarball, `InputServiceWorker.js`, `ruff.js` and a `PythonWorker.js` that keeps the bare `@astral-sh/ruff-wasm-web` import for the consumer's bundler. |

Two deviations from the plan, both found while probing the API:

- Ruff 0.16.7 reports a syntax error with `code: "invalid-syntax"`, not `null` as the
  typings say. `ruff.ts` treats both as a syntax error (severity error, no `code`).
- `PLR0902` and `PLR0903` (too-many-instance-attributes, too-few-public-methods) are
  preview rules in ruff and cannot be named in `ignore` without preview mode, so they are
  simply absent from the rule set. `PLR0904` and `PLR0911` are stable and are ignored as
  planned. `py314` is accepted as target version.

## 2. Lint latency

Measured inside the worker with `performance.now()` around the linter call
(`PythonWorker.getLintTimings()`), 5 runs per sample per linter, median of runs 2 to 5.
"first" is run 1, which pays each linter's one-time costs. The pylint install column is
the `install_imports` call that runs before every pylint lint: first run, then median of
the later runs. Ruff never installs anything, so that column is absent for it. Measured by
`test/__spike__/RuffSpike.test.ts` (`VITE_RUFF_SPIKE=1 npx vitest run --exclude ".claude/**" --reporter=verbose test/__spike__`).

| sample | lines | pylint lint | pylint install (first / later) | ruff lint | ruff first lint | pylint / ruff |
|---|---:|---:|---:|---:|---:|---:|
| example: Hello, World! | 1 | 27 (first 703) | 1.6 / 0.7 | 0.1 | 44 | 268× |
| example: Input | 2 | 22 (first 22) | 0.7 / 0.6 | 0.0 | 1.4 | >440× |
| example: Fibonacci | 4 | 24 (first 24) | 0.7 / 0.6 | 0.1 | 4.0 | 479× |
| example: Doctests | 50 | 27 (first 31) | 0.9 / 0.8 | 0.2 | 1.8 | 137× |
| example: Async | 16 | 22 (first 884) | 0.6 / 0.6 | 0.1 | 0.7 | 224× |
| example: Erroneous | 32 | 19 (first 19) | 0.8 / 0.7 | 0.1 | 0.5 | 189× |
| example: Unicode | 5 | 23 (first 52) | 0.9 / 0.5 | 0.0 | 1.7 | >453× |
| example: Files | 8 | 21 (first 23) | 0.6 / 0.6 | 0.0 | 1.2 | >422× |
| example: Turtle | 8 | 22 (first 119) | 34 / 0.7 | 0.0 | 0.3 | >443× |
| example: Matplotlib | 19 | 25 (first 1223) | 1042 / 0.8 | 0.0 | 0.3 | >506× |
| example: Sleep | 9 | 22 (first 24) | 0.7 / 0.5 | 0.0 | 0.2 | >435× |
| example: Overflow | 9 | 23 (first 40) | 0.7 / 0.6 | 0.0 | 0.4 | >463× |
| example: Interrupt | 5 | 23 (first 22) | 0.6 / 0.5 | 0.1 | 0.2 | 234× |
| long sample (~100 lines) | 94 | 55 (first 57) | 2.1 / 2.0 | 0.3 | 1.2 | 184× |
| mistake: unused variable in a function | 4 | 20 (first 20) | 0.5 / 0.4 | 0.0 | 0.5 | >392× |
| mistake: unused import | 3 | 20 (first 24) | 0.5 / 0.4 | 0.1 | 6.4 | 402× |
| mistake: undefined name | 2 | 19 (first 19) | 0.6 / 0.4 | 0.0 | 0.2 | >379× |
| mistake: x = x | 3 | 20 (first 21) | 0.5 / 0.4 | 0.0 | 0.2 | >404× |
| mistake: x += 0 | 4 | 20 (first 20) | 0.6 / 0.5 | 0.0 | 0.1 | >409× |
| mistake: if True: | 3 | 20 (first 22) | 0.5 / 0.4 | 0.0 | 0.2 | >405× |
| mistake: missing str method | 3 | 21 (first 22) | 0.5 / 0.4 | 0.0 | 0.1 | >429× |
| mistake: from os import nope | 3 | 20 (first 22) | 0.5 / 0.5 | 0.0 | 0.2 | >395× |
| mistake: missing docstring | 3 | 20 (first 19) | 0.4 / 0.3 | 0.1 | 0.1 | 395× |
| mistake: bad name foo | 3 | 19 (first 19) | 0.5 / 0.3 | 0.0 | 0.1 | >385× |
| mistake: syntax error | 2 | 18 (first 19) | 0.5 / 0.4 | 0.0 | 0.1 | >370× |
| mistake: statement without effect | 4 | 21 (first 22) | 0.6 / 0.5 | 0.0 | 0.2 | >417× |
| mistake: comparison with None | 4 | 21 (first 21) | 0.4 / 0.6 | 0.0 | 0.5 | >419× |
| mistake: mutable default | 4 | 21 (first 21) | 0.4 / 0.5 | 0.0 | 0.1 | >425× |
| mistake: shadowed builtin | 3 | 19 (first 20) | 0.4 / 0.4 | 0.0 | 0.1 | >378× |

Notes:

- Pylint in Pyodide is faster than the server side numbers suggested: 20 to 27 ms for
  short programs, 55 ms for 94 lines. Ruff is 200 to 500 times faster but both are far
  below what a user notices per keystroke.
- Pylint's first lint after boot costs 0.7 s (pylint and astroid importing their checkers).
  Astroid also pays once per new library it has to model: 0.9 s for the first `asyncio`
  program, 1.2 s for the first `matplotlib` program.
- The install column is the real pylint cost. With matplotlib already in the browser
  cache, `install_imports` still took 1.0 s on the first lint of that program; on a cold
  cache it is the full wheel download. Turtle costs 34 ms because the bundled svg-turtle
  is set up on first use.
- Ruff's first ever `check()` costs 44 ms (lazy initialisation inside the wasm); later
  first lints are 0.1 to 6 ms.

## 3. Time to first lint

Measured in the dev server, three runs per linter, each in a fresh Playwright browser
context (empty HTTP cache, but everything served from localhost, so the download of the
10.9 MB wasm costs almost nothing here; on a real connection add the transfer of 2.6 MB
brotli). `first lint` is the time from page start until a `lintSource()` called as soon as
the papyros instance existed resolved. `ruff ready` and `Pyodide ready` come from
`getLintTimings()` and count from the worker's start.

| linter | first lint (median, ms) | ruff ready (ms) | Pyodide + micropip ready (ms) |
|---|---:|---:|---:|
| ruff | 2,918 | 69 | 2,723 |
| pylint | 3,618 | 67 | 2,626 |

Ruff is ready to lint about 70 ms after the worker starts, including the wasm compile;
Pyodide takes 2.6 to 2.7 s. That gap is not visible in the editor yet, because
`Runner.lintSource()` awaits the backend's launch promise, which resolves only after
Pyodide and micropip are loaded. Letting a ruff lint through before the launch completes
would show the first diagnostics about 2.6 s earlier on a cold load; on a warm cache the
gap is the Pyodide boot alone. The 0.7 s between the two first-lint figures is pylint's own
initialisation on its first run (section 2).

## 4. Payload

| asset | raw | gzip -9 | brotli -q 11 |
|---:|---:|---:|---:|
| `ruff_wasm_bg.wasm` | 10,893,058 | 3,784,305 | 2,596,207 |
| `ruff_wasm.js` | 26,641 | 5,455 | |
| `python_package.tar.gz.load_by_url` (whole tarball) | 8.1 MB unpacked | 1,532,134 as built (1,571,500 re-tarred with gzip -9) | |
| of which pylint + astroid | 3.3 MB unpacked | 698,096 | |
| of which pylint + astroid + their deps (isort, dill, mccabe, tomlkit, tomli, platformdirs) | 5.3 MB unpacked | 1,097,526 | |
| everything else in the tarball (papyros, friendly_traceback, tracer, svg-turtle, ...) | | 477,854 | |
| `pyodide.asm.wasm` (for scale, loaded either way) | 9,598,218 | 3,542,408 | 2,767,563 |

So pylint and its dependencies are 70% of the tarball. Over the wire, ruff costs about
2.4 times pylint's share with brotli and is the same order as Pyodide itself. In
uncompressed bytes the browser has to compile 10.9 MB of wasm, which is what the
`ruffReady` number in section 3 pays for. The wasm is cached like any other asset, so this
is a cold load cost.

Side finding: the tarball contains `ddc459050edb75a05942__mypyc.cpython-314-darwin.so`
(428 KB unpacked), a macOS native extension that `pip install -t` picked up from the tomli
wheel. It can never load under Emscripten and could be filtered out of `build_package.py`.

## 5. Diagnostic diff

Every sample program from the demo, the 94-line sample from the spike test, and short
programs for typical beginner mistakes. Same code through both linters, messages as the
editor would show them, with ruff's rule id in brackets. An empty row means neither
linter reported anything.

### example: Hello, World! (1 lines)

| pylint | ruff |
|---|---|
|  |  |

### example: Input (2 lines)

| pylint | ruff |
|---|---|
|  |  |

### example: Fibonacci (4 lines)

| pylint | ruff |
|---|---|
|  |  |

### example: Doctests (50 lines)

| pylint | ruff |
|---|---|
| L28: Import outside toplevel (math) | L28: `import` should be at the top-level of a file [PLC0415] |
| L42: Unused argument 'n' |  |

### example: Async (16 lines)

| pylint | ruff |
|---|---|
| L15: 'await' should be used within an async function | L15: `await` statement outside of a function [F704] |
|  | L15: `await` should be used within an async function [PLE1142] |

### example: Erroneous (32 lines)

| pylint | ruff |
|---|---|
| L6: invalid syntax | L6: Simple statements must be separated by newlines or semicolons [syntax] |
|  | L17: Statement ends with an unnecessary semicolon [E703] |
|  | L27: Statement ends with an unnecessary semicolon [E703] |
|  | L22: Blank line contains whitespace [W293] |

### example: Unicode (5 lines)

| pylint | ruff |
|---|---|
|  |  |

### example: Files (8 lines)

| pylint | ruff |
|---|---|
|  |  |

### example: Turtle (8 lines)

| pylint | ruff |
|---|---|
|  |  |

### example: Matplotlib (19 lines)

| pylint | ruff |
|---|---|
|  |  |

### example: Sleep (9 lines)

| pylint | ruff |
|---|---|
|  |  |

### example: Overflow (9 lines)

| pylint | ruff |
|---|---|
|  |  |

### example: Interrupt (5 lines)

| pylint | ruff |
|---|---|
|  |  |

### long sample (~100 lines) (94 lines)

| pylint | ruff |
|---|---|
| L73: Disallowed name "bar" |  |

### mistake: unused variable in a function (4 lines)

| pylint | ruff |
|---|---|
| L2: Unused variable 'unused' | L2: Local variable `unused` is assigned to but never used [F841] |

### mistake: unused import (3 lines)

| pylint | ruff |
|---|---|
| L1: Unused import os | L1: `os` imported but unused [F401] |

### mistake: undefined name (2 lines)

| pylint | ruff |
|---|---|
| L1: Undefined variable 'undefined_name' | L1: Undefined name `undefined_name` [F821] |

### mistake: x = x (3 lines)

| pylint | ruff |
|---|---|
| L2: Assigning the same variable 'x' to itself | L2: Self-assignment of variable `x` [PLW0127] |
| L2: Useless assignment: <x> = <x> |  |

### mistake: x += 0 (4 lines)

| pylint | ruff |
|---|---|
| L2: Useless increment: xxx += 0 |  |

### mistake: if True: (3 lines)

| pylint | ruff |
|---|---|
| L1: Using a conditional statement with a constant value |  |

### mistake: missing str method (3 lines)

| pylint | ruff |
|---|---|
| L2: Instance of 'str' has no 'uppercase' member |  |

### mistake: from os import nope (3 lines)

| pylint | ruff |
|---|---|
| L1: No name 'nope' in module 'os' |  |

### mistake: missing docstring (3 lines)

| pylint | ruff |
|---|---|
|  |  |

### mistake: bad name foo (3 lines)

| pylint | ruff |
|---|---|
| L1: Disallowed name "foo" |  |

### mistake: syntax error (2 lines)

| pylint | ruff |
|---|---|
| L1: Missing parentheses in call to 'print'. Did you mean print(...)? | L1: Simple statements must be separated by newlines or semicolons [syntax] |

### mistake: statement without effect (4 lines)

| pylint | ruff |
|---|---|
| L3: Statement seems to have no effect |  |

### mistake: comparison with None (4 lines)

| pylint | ruff |
|---|---|
| L2: Comparison 'x == None' should be 'x is None' | L2: Comparison to `None` should be `cond is None` [E711] |

### mistake: mutable default (4 lines)

| pylint | ruff |
|---|---|
| L1: Dangerous default value [] as argument |  |

### mistake: shadowed builtin (3 lines)

| pylint | ruff |
|---|---|
|  |  |

### What has no ruff counterpart

Everything pylint reports through astroid's inference is absent from ruff by design:

| pylint | example above | ruff |
|---|---|---|
| E1101 no-member | `s.uppercase()` on a str | none |
| E0611 no-name-in-module | `from os import nope` | none (F401 would flag it as unused, but it is used) |
| E0401 import-error | `import this_does_not_exist` | none |
| E1120 no-value-for-parameter, E1102 not-callable | | none |
| W0104 pointless-statement | bare `print` | B018 (flake8-bugbear, not in the E/W/F/PL select) |
| W0102 dangerous-default-value | `def f(a=[])` | B006 (flake8-bugbear, not selected) |
| W0125 using-constant-test | `if True:` | none |
| C0104 disallowed-name | `foo`, `bar` | none |
| W0104 useless-increment (papyros NoOpChecker C0002) | `x += 0` | none |
| useless assignment `<x> = <x>` (NoOpChecker) | `x = x` | PLW0127 (reported) |
| W0612 unused-argument | Doctests example line 42 | ARG001 (flake8-unused-arguments, not selected) |

Ruff's syntax error message is the parser's ("Simple statements must be separated by
newlines or semicolons", positioned at the second statement) where pylint forwards
CPython's "Missing parentheses in call to 'print'. Did you mean print(...)?" at column 0.

### What ruff adds with this rule set

- E703 unnecessary semicolon and W293 whitespace on a blank line (the Erroneous example).
  pylint's C0303 covers trailing whitespace and is disabled in the rc; W293 is a separate
  rule in ruff so it is not covered by ignoring W291.
- PLE1142 `await` outside async function next to F704, so one mistake gives two messages.
  One of them should be ignored.
- PLC0415 import outside top level, same as pylint's C0415.

Things both are silent on with the current configuration: missing docstrings (C0114 to
C0116 disabled, D rules not selected) and shadowed builtins (W0622 disabled, A001 not
selected).

## 6. Integration in Dodona

Dodona imports the worker with `?worker&url` from `@dodona/papyros/dist/...` and builds it
with Vite 8.2.2 on Rolldown. Ruff's `init()` resolves the wasm with
`new URL('ruff_wasm_bg.wasm', import.meta.url)`, the same idiom papyros already uses for
`python_package.tar.gz.load_by_url`, which Dodona's build turns into a hashed asset
(`app/assets/builds/python_package.tar.gz-<hash>.digested.load_by_url`) without any
special configuration. A scratch build with Dodona's own vite binary of a fake package
using ruff's exact idiom, imported by bare specifier from a `?worker&url` entry, emitted the
wasm as its own hashed asset and rewrote the URL. Conclusion: `launch()` does not need a
`ruffAssetURL` parameter. Not verified: Dodona's dev server, and a real build once Dodona
picks up a papyros version that depends on ruff.

In papyros' own dev server the package had to be excluded from `optimizeDeps`, because a
pre-bundled copy in `.vite/deps` no longer sits next to the wasm.

## 7. What the spike did not do

- Pylint stays in the tarball and on by default; nothing was removed.
- The severity table for ruff codes is provisional (F, E9, PLE are errors; W, PLW, B are
  warnings; the rest info).
- `Runner.lintSource()` still waits for the full backend launch before the first lint,
  also for ruff.
- No message translation, no shared catalogue, no TESTed or judge-pythia changes.

## 8. Follow-up: single-file beginner programs and a tarball without pylint

Asked after the first round: what is lost for the Dodona use case (single-file solutions of
a few hundred lines, hardly any imports), and what a tarball without pylint saves at boot.

### Extra mistakes, pylint versus ruff

Native pylint 4.0.7 with papyros' rc and plugins (the same rule set the worker runs)
against ruff 0.16.7 in node. "ruff, spike rules" is the E/W/F/PL set from section 1;
"ruff, extra families" is what appears on top when B, ARG, PIE, SIM, RET, C4, A, RUF, N,
FURB, PERF, TRY, BLE and UP are selected as well. Format `rule:line:message`.

| mistake | pylint | ruff, spike rules | ruff, extra families |
|---|---|---|---|
| wrong arg count (own function) | E1120:4:No value for argument 'b' in function call | - | - |
| too many args (own function) | E1121:4:Too many positional arguments for function call | - | - |
| from math import sqroot | E0611:1:No name 'sqroot' in module 'math' | - | - |
| import mathh | E0401:1:Unable to import 'mathh' | - | - |
| list.push | E1101:2:Instance of 'list' has no 'push' member | - | - |
| str + int | - | - | - |
| input + int | - | - | - |
| bare name statement | W0104:2:Statement seems to have no effect | - | B018:2:Found useless expression. Either assign it to a variable or remove it. |
| unreachable after return | W0101:3:Unreachable code | - | RET503:1:Missing explicit `return` at the end of function able to return non-`None` value |
| range(len(xs)) | C0200:2:Consider using enumerate instead of iterating with range and len | - | - |
| if x == True | C0002:2:Useless equality test: if xxx == True<br>C0121:2:Comparison 'x == True' should be 'x is True' if checking for the singleton value True, or 'x' if testing for truthiness | E712:2:Avoid equality comparisons to `True`; use `x:` for truth checks | - |
| x = x + 1 | C0008:2:Self-assignment: use the equivalent shorthand notation | - | - |
| if pass else | C0007:2:Useless pass statement: rewrite the if statement as | - | - |
| len(xs) == 0 | - | - | - |
| return at module level | E0104:1:Return outside function | F706:1:`return` statement outside of a function/method | - |
| redefined function | E0102:4:function already defined line 1 | F811:4:Redefinition of unused `f` from line 1: `f` redefined here | - |
| bare except | W0702:3:No exception type(s) specified | E722:3:Do not use bare `except` | SIM105:1:Use `contextlib.suppress(BaseException)` instead of `try`-`except`-`pass` |
| unused exception var | - | F841:3:Local variable `e` is assigned to but never used | - |
| int(int(x)) | - | - | RUF046:2:Value being cast to `int` is already an integer |
| global at module level | W0604:1:Using the global statement at the module level | PLW0604:1:`global` at module level is redundant<br>PLW0603:1:Using the global statement to update `x` is discouraged | - |
| assignment in if | E0001:2:Parsing failed: 'invalid syntax. Maybe you meant '==' or ':=' instead of '='? (tmpatq8285v, line 2)' | invalid-syntax:2:Expected `:`, found `=`<br>invalid-syntax:2:Invalid annotated assignment target<br>invalid-syntax:2:Expected an expression<br>invalid-syntax:3:Unexpected indentation | - |
| missing colon | E0001:1:Parsing failed: 'expected ':' (tmpuy0dr_nf, line 1)' | invalid-syntax:1:Expected `:`, found newline | - |
| unclosed paren | E0001:1:Parsing failed: ''(' was never closed (tmpuor7l0ux, line 1)' | invalid-syntax:2:unexpected EOF while parsing | - |
| bad indentation | E0001:2:Parsing failed: 'expected an indented block after function definition on line 1 (tmp9gfafcri, line 2)' | invalid-syntax:2:Expected an indented block after function definition | - |
| tab/space mix | E0001:3:Parsing failed: 'inconsistent use of tabs and spaces in indentation (tmprqw029a4, line 3)' | invalid-syntax:3:unindent does not match any outer indentation level<br>invalid-syntax:4:Expected dedent, found end of file<br>W191:3:Indentation contains tabs | - |
| while with no update | - | - | - |
| is with literal | R0123:2:In 'x is 5', use '==' when comparing constant literals not 'is' ('x == 5') | F632:2:Use `==` to compare constant literals | - |
| not in as not x in | C0117:2:Consider changing "not 1 in xs" to "1 not in xs" | E713:2:Test for membership should be `not in` | - |
| unused loop variable | - | - | B007:1:Loop control variable `i` not used within loop body |
| return in __init__ | E0101:2:Explicit return in __init__ | PLE0101:3:Explicit return in `__init__` | - |
| self missing | E0211:2:Method 'f' has no argument | - | - |
| attribute on own class | E1101:5:Instance of 'A' has no 'y' member; maybe 'x'? | - | - |

What this says for the go/no-go:

- Lost outright, no ruff rule can do it because it needs astroid's inference: wrong
  argument count when calling your own function (E1120, E1121), method or attribute that
  does not exist on a list, str or your own class (E1101), a name that does not exist in
  a module (E0611, `from math import sqroot`), an import that cannot be resolved (E0401),
  method without `self` (E0211), unreachable code (W0101). For beginners the first three
  are the useful ones. Pylint reports them at lint time; with ruff they surface only when
  the code runs, where friendly_traceback still explains the exception.
- Lost from papyros' own checkers unless reimplemented: `x = x + 1` (C0008), `if ...: pass
  else:` (C0007), `x += 0` (C0003), `if True:` (W0125), `range(len(xs))` (C0200).
  `x == True` (C0002) and `x = x` (C0006) have ruff equivalents (E712, PLW0127).
- Covered by ruff with more rule families: pointless statement (B018), unused loop
  variable (B007), mutable default (B006), `int(int(x))` (RUF046), missing return on a
  path (RET503). These families are not in pylint at all, so ruff also adds checks.
- Syntax errors: pylint forwards CPython's messages ("Maybe you meant '==' or ':='",
  "'(' was never closed", "inconsistent use of tabs and spaces"), ruff's parser is terser
  and sometimes emits three or four follow-on errors for one mistake (`if x = 1:`). A
  cheap mitigation is to keep CPython's `compile()` in Pyodide for the syntax error text
  and use ruff for everything else; that needs no pylint.
- Neither linter catches the runtime type mistakes beginners make most (`'a' + 1`,
  `input() + 1`), so those are not part of the trade-off.

### Tarball without pylint

`requirements.txt` without pylint and tomli, rebuilt with `build_package.py`, measured
like section 3 (three cold contexts, localhost):

| tarball | size on disk | unpacked | Pyodide + micropip ready (median, ms) | first ruff lint (median, ms) |
|---|---:|---:|---:|---:|
| current, with pylint | 1,532 KB | 8.1 MB | 2,626 to 2,723 | 2,918 |
| without pylint and tomli | 461 KB | 2.4 MB | 2,452 | 2,651 |

About 0.2 to 0.3 s less at boot on localhost from unpacking 5.7 MB fewer files, plus 1.07 MB
less to download on a real connection. Pyodide's own boot (wasm compile, stdlib, micropip)
is the remaining 2.4 s and does not change. Pylint is never imported at boot today: the
worker imports `linting` lazily on the first lint, so removing it does not shorten the
boot beyond the download and unpack.

## 9. Follow-up: would ty cover the inference checks

ty 0.0.80 (2026-09-09), run natively on the section 8 samples with `--python-version 3.14`.
ty does inference, so it reports what pylint's astroid checks reported, and more:

| mistake | ty |
|---|---|
| wrong arg count / too many args to own function | `missing-argument`, `too-many-positional-arguments` |
| `from math import sqroot`, `import mathh` | `unresolved-import` (both) |
| `xs.push(3)`, `a.y` on own class, `s.uppercase()` | `unresolved-attribute` |
| `'a' + 1`, `input() + 1` | `unsupported-operator`, which neither pylint nor ruff reported |
| undefined name | `unresolved-reference` |
| method without `self`, unreachable code | nothing (the first is caught at the call site) |
| unused import, unused variable, style | nothing; that is ruff's job |

Syntax errors use the same parser and messages as ruff.

Cost: there is no published npm package yet; the playground at play.ty.dev ships its own
build, `ty_wasm_bg.wasm`, at 18.5 MB raw, 7.5 MB gzip, 5.3 MB brotli (typeshed is vendored
into the binary). Together with ruff that is 7.9 MB brotli on a cold load against pylint's
1.1 MB share of the tarball. ty is pre-1.0 and its diagnostics and defaults still move
between releases. Not measured: false positives on real, unannotated student code, which
is the thing to test on a corpus before deciding, and how the judge side would run it.
