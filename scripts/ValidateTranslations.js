const extract = require("i18n-extract");
const translations = require("../src/Translations.ts").TRANSLATIONS;
const fs = require("fs");

const outputFile = fs.openSync("translationIssues.txt", "w");

const usedKeys = extract.extractFromFiles([
    "src/**/*.ts"
], {
    marker: "t", // renamed I18n.t to t for convenience
    babelOptions: {
        ast: true,
        parserOpts: {
            sourceType: 'module',
            plugins: [
                'decorators',
                'typescript'
            ],
        }
    }
});

const checks = [
    {
        "type": "missing",
        "check": extract.findMissing,
        "allowed": ["Papyros.debugger"]
    },
    {
        "type": "unused",
        "check": extract.findUnused,
        "allowed": [
            "Papyros.debugger.title",
            "Papyros.debugger.text_1",
            "Papyros.debugger.text_2"
        ]
    },
    {
        "type": "duplicate",
        "check": extract.findDuplicated,
        "allowed": []
    },
    {
        "type": "dynamic",
        "check": extract.forbidDynamic,
        "allowed": [
            "Papyros.programming_languages.*",
            "Papyros.locales.*",
            "Papyros.states.*",
            "Papyros.switch_input_mode_to.*",
            "Papyros.input_placeholder.*",
            "Papyros.run_modes.*"
        ]
    }
];

function checkReport(report, type) {
    const valid = report.length === 0;
    if (!valid) {
        const errorNumber = checks.map(c => c.type).indexOf(type);
        for (const issue of report) {
            let line = "1";
            let column = "1";
            if (issue.loc && issue.loc.start) {
                line = issue.loc.start.line;
                column = issue.loc.start.column;
            }
            const file = issue.file || "src/Translations.js";
            const errorMsg = `R${errorNumber} ${type} key ${issue.key}`;
            fs.writeFileSync(outputFile, `${file}:${line}:${column}: ${errorMsg}\n`);
        }
    }
    return valid;
}
for (const locale of Object.keys(translations)) {
    // requires flattening as the translations object uses the Papyros-scope
    const localeKeys = extract.flatten(translations[locale]);
    for (const check of checks) {
        checkReport(
            check.check(localeKeys, usedKeys).filter(k => !check.allowed.includes(k.key)),
            check.type
        );
    }
}


