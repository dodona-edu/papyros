const extract = require("i18n-extract");
const translations = require("../src/Translations.js");
const fs = require("fs");

const outputFile = fs.openSync("translationIssues.txt", "w");
function checkReport(report, type, locale) {
    const valid = report.length === 0;
    if (!valid) {
        console.log(`Found ${report.length} ${type} keys for locale: ${locale}.`);
        console.log(report);
        console.log(JSON.stringify(report));
        for (const issue of report) {
            const {
                line, column
            } = issue.loc.start;
            const errorMsg = `${type} key ${issue.key} for locale ${locale}`;
            fs.writeFileSync(outputFile, `${issue.file}:${line}:${column}: ${errorMsg}\n`);
        }
    }
    return valid;
}

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
        // "allowed": ["Papyros.programming_languages.*", "Papyros.locales.*", "Papyros.states.*"]
        "allowed": []
    }
];


let validTranslations = true;
for (const locale of Object.keys(translations)) {
    // requires flattening as the translations object uses the Papyros-scope
    const localeKeys = extract.flatten(translations[locale]);
    for (const check of checks) {
        // not &&= to ensure checkReport is actually executed
        validTranslations = checkReport(
            check.check(localeKeys, usedKeys).filter(k => !check.allowed.includes(k.key)),
            check.type, locale
        ) && validTranslations;
    }
}
if (!validTranslations) {
    process.exit(1);
} else {
    console.log("All translation operations are valid.");
}

