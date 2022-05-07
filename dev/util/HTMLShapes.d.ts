/**
 * Draw a spinning circle to represent a loading animation
 * @param {string} id HTML id for this element
 * @param {string} borderColors The tailwind color classes for the borders of the circle
 * @return {string} A string representation of the circle
 */
export declare const spinningCircle: (id: string, borderColors: string) => string;
/**
 * Wrap text (best a single character) in a circle to provide information to the user
 * @param {string} content The symbol in the circle, e.g. ? of !
 * @param {string} title The information to display when hovering over the element
 * @param {string} colorClasses The classes to color the content
 * @return {string} A string representation of the circle with content
 */
export declare const inCircle: (content: string, title: string, colorClasses: string) => string;
