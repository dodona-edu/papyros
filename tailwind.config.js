const flattenColorPalette = require('tailwindcss/lib/util/flattenColorPalette').default;

// Scale sizes according to 80vh to prevent overflows
const HEIGHTS = {
  "0": "0",
  "1/8": "10vh",
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
const COLORS = {
  "dark-mode-bg": "#263238",
  "dark-mode-content": "#37474F",
  "dark-mode-blue": "#0277BD",
  "placeholder-grey": "#888"
};

/**
 * Plugin to enable more border-color variations in Tailwind
 * Plugin source: https://github.com/tailwindlabs/tailwindcss/pull/560
 * Issue concerning border colors: https://github.com/tailwindlabs/discuss/issues/46
 */
const borderPlugin = ({ addUtilities, e, theme, variants }) => {
  let colors = flattenColorPalette(theme('borderColor'));
  delete colors['default'];

  // Replace or Add custom colors
  if (this.theme?.extend?.colors !== undefined) {
    colors = Object.assign(colors, this.theme.extend.colors);
  }

  const colorMap = Object.keys(colors)
    .map(color => ({
      [`.border-t-${color}`]: { borderTopColor: colors[color] },
      [`.border-r-${color}`]: { borderRightColor: colors[color] },
      [`.border-b-${color}`]: { borderBottomColor: colors[color] },
      [`.border-l-${color}`]: { borderLeftColor: colors[color] },
    }));
  const utilities = Object.assign({}, ...colorMap);

  addUtilities(utilities, variants('borderColor'));
};

module.exports = {
  // allow using dynamic classes
  mode: "jit",
  // Allow toggling dark mode using a class
  darkMode: "class",
  content: [
    "./src/**/*.ts",
  ],
  prefix: "_tw-",
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
      minHeight: HEIGHTS,
      // Specify for all used kinds to ensure they are kept
      colors: COLORS,
      borderColor: COLORS,
      backgroundColor: COLORS
    },
  },
  plugins: [borderPlugin],
  important: true
};
