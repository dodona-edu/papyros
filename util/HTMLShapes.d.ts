/**
 * Draw a circle using an HTML svg element
 * @param {string} id HTML id for this element
 * @param {string} color The color of the circle
 * @return {string} A string representation of the circle
 */
export declare const svgCircle: (id: string, color: string) => string;
/**
 * Wrap text (best a single character) in a circle to provide information to the user
 * @param {string} content The symbol in the circle, e.g. ? of !
 * @param {string} title The information to display when hovering over the element
 * @param {string} color The color of the circle and the symbol
 * @return {string} A string representation of the circle with content
 */
export declare const inCircle: (content: string, title: string, color: string) => string;
