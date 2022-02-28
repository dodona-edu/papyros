// Scale sizes according to 80vh to prevent overflows
const HEIGHTS = {
  "0": "0",
  "1/5": "16vh",
  "1/4": "20vh",
  "2/5": "32vh",
  "1/2": "40vh",
  "3/5": "48vh",
  "3/4": "60vh",
  "4/5": "64vh",
  "9/10": "72vh",
  "full": "80vh"
};
module.exports = {
  purge: [
    "./src/**/*.ts",
  ],
  variants: {
    extend: {
      // generate classes for these states
      backgroundColor: ["active"],
      opacity: ['disabled'],
      cursor: ['disabled', 'hover'],
      borderWidth: ['focus']
    }
  },
  theme: {
    extend: {
      maxHeight: HEIGHTS,
      minHeight: HEIGHTS
    }
  }
};
