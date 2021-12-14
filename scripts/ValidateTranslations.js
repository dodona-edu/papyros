const extract = require("i18n-extract");
const translations = require("../src/Translations.js").TRANSLATIONS;
const fs = require("fs");

const outputFile = fs.openSync("translationIssues.txt", "w");

const usedKeys = extract.extractFromFiles([
    "src/*.ts"
], {
    marker: "t", // renamed I18n.t to t for convenience
    parser: "typescript",
});

const checks = [
    {
        "type": "missing",
        "check": extract.findMissing,
        "allowed": []
    },
    {
        "type": "unused",
        "check": extract.findUnused,
        "allowed": []
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
            "Papyros.input_modes.switch_to_*",
            "Papyros.input_placeholder.*"
        ]
    }
];

function checkReport(report, type, locale) {
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
            const errorMsg = `R${errorNumber} ${type} key ${issue.key} for locale ${locale}`;
            fs.writeFileSync(outputFile, `${file}:${line}:${column}: ${errorMsg}\n`);
        }
    }
    return valid;
}

for (const locale of Object.keys(translations)) {
    // requires flattening as the translations object uses the Papyros-scope
    const localeKeys = extract.flatten(translations[locale]);
    for (const check of checks) {
        // not &&= to ensure checkReport is actually executed
        checkReport(
            check.check(localeKeys, usedKeys).filter(k => !check.allowed.includes(k.key)),
            check.type, locale
        );
    }
}

