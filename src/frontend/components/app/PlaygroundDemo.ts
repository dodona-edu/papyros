import { customElement } from "lit/decorators.js";
import { css, CSSResult, html, LitElement, TemplateResult } from "lit";
import { Papyros } from "../../state/Papyros";
import { PapyrosRuntime } from "../../state/PapyrosRuntime";
import blueLight from "../../state/themes/blue-light";
import blueDark from "../../state/themes/blue-dark";
import "../CodePlayground";

interface Scenario {
    title: string;
    description: string;
    code: string;
    label?: string;
    files?: string;
}

const SCENARIOS: Scenario[] = [
    {
        title: "Read a data file",
        description: "The file is listed in the tab above the code. Run the code to print it.",
        files: "playground/grades.txt",
        code: `grade_file = open('grades.txt')
contents = grade_file.read()
grade_file.close()

print(contents)
`,
    },
    {
        title: "Other data under the same name",
        description: "This block also opens grades.txt, but its file is playground/example-2/grades.txt.",
        label: "Other grades",
        files: "playground/example-2/grades.txt",
        code: `grade_file = open('grades.txt')

total = 0
count = 0
for line in grade_file:
    grade = int(line.strip())
    total += grade
    count += 1

grade_file.close()

print(total/count)
`,
    },
    {
        title: "Every run starts clean",
        description: "Run this block twice: it prints one line each time.",
        label: "Run me twice",
        code: `log = open('log.txt', 'a')
log.write('one more line\\n')
log.close()

print(open('log.txt').read())
`,
    },
    {
        title: "A workspace of its own",
        description: "Files written by the block above are gone: this one lists an empty workspace.",
        label: "What is in the workspace?",
        code: `import os
print(os.listdir())
`,
    },
    {
        title: "Input",
        description: "Run it and type a name in the input field.",
        code: `name = input("What is your name? ")
print(f"Hello, {name}!")
`,
    },
    {
        title: "A traceback",
        description: "The error shows below the output that came before it.",
        code: `print("Dividing...")
print(1 / 0)
`,
    },
    {
        title: "Several files, one of them an image",
        description: "Binary files are not previewed: the tab links to the file instead.",
        files: "playground/grades.txt playground/dodona.png",
        code: `import os
print(sorted(os.listdir()))
print(os.path.getsize('dodona.png'), 'bytes')
`,
    },
    {
        title: "A missing file",
        description: "The file cannot be loaded, so an alert shows and the code does not run.",
        files: "playground/missing.txt",
        code: `print(open('missing.txt').read())
`,
    },
    {
        title: "A long-running loop",
        description: "Run it, then try Stop. While it runs, the Run buttons of the other blocks are disabled.",
        label: "Stop me",
        code: `import time

counter = 0
while True:
    counter += 1
    print(counter)
    time.sleep(1)
`,
    },
];

/**
 * A page with fixed code playground scenarios that share one runtime.
 * It follows the system setting for light or dark.
 */
@customElement("p-playground-demo")
export class PlaygroundDemo extends LitElement {
    static get styles(): CSSResult {
        return css`
            :host {
                display: block;
                min-height: 100vh;
                box-sizing: border-box;
                padding: 1rem 1.5rem 3rem;
                background-color: var(--md-sys-color-background);
                color: var(--md-sys-color-on-background);
                font-family: Roboto, "Helvetica Neue", sans-serif;
            }

            main {
                max-width: 900px;
                margin: 0 auto;
            }

            h1 {
                color: var(--md-sys-color-primary);
            }

            h2 {
                margin-bottom: 0.25rem;
                font-size: 1.25rem;
            }

            p {
                margin: 0.25rem 0;
            }

            a {
                color: var(--md-sys-color-primary);
            }
        `;
    }

    private readonly runtime = new PapyrosRuntime();
    private readonly playgrounds = SCENARIOS.map(() => new Papyros({ runtime: this.runtime }));
    private readonly darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    private readonly onSchemeChange = (): void => this.applyTheme();

    public override connectedCallback(): void {
        super.connectedCallback();
        this.applyTheme();
        this.darkQuery.addEventListener("change", this.onSchemeChange);
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.darkQuery.removeEventListener("change", this.onSchemeChange);
    }

    /**
     * The theme sets the --md-sys-color-* properties on the document, so the playgrounds
     * pick them up through their shadow roots.
     */
    private applyTheme(): void {
        const dark = this.darkQuery.matches;
        document.documentElement.style.setProperty("color-scheme", dark ? "dark" : "light");
        document.adoptedStyleSheets = [(dark ? blueDark : blueLight).styleSheet!];
    }

    protected override render(): TemplateResult {
        return html`
            <main>
                <h1>Papyros code playgrounds</h1>
                <p>
                    Each block below is a <code>&lt;p-code-playground&gt;</code> with its own Papyros instance. They
                    share one runtime, so Python boots once and the blocks take turns running.
                </p>
                ${SCENARIOS.map(
                    (scenario, i) => html`
                        <section>
                            <h2>${scenario.title}</h2>
                            <p>${scenario.description}</p>
                            <p-code-playground
                                .papyros=${this.playgrounds[i]}
                                .code=${scenario.code}
                                .label=${scenario.label}
                                files=${scenario.files ?? ""}
                            ></p-code-playground>
                        </section>
                    `,
                )}
            </main>
        `;
    }
}
