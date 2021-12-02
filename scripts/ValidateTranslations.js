const extract = require("i18n-extract");
const translations = require("../src/Translations.js");

const usedKeys = extract.extractFromFiles([
    "src/*.ts"
], {
    marker: "t", // renamed I18n.t to t for convenience
    parser: "typescript",
});
let validTranslations = true;
for (const locale of Object.keys(translations)) {
    const missing = extract.findMissing(
        // requires flattening as the translations object uses the Papyros-scope
        extract.flatten(translations[locale]),
        usedKeys
    );
    if (missing.length > 0) {
        console.log(`Found missing keys for locale: ${locale}`);
        validTranslations = false;
    }
}
if (!validTranslations) {
    process.exit(1);
} else {
    console.log("All translation keys present.");
}

