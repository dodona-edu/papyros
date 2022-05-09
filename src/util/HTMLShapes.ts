/**
 * Draw a spinning circle to represent a loading animation
 * @param {string} id HTML id for this element
 * @param {string} borderColors The tailwind color classes for the borders of the circle
 * @return {string} A string representation of the circle
 */
export function renderSpinningCircle(id: string, borderColors: string): string {
    return `
<div id="${id}" class="_tw-animate-spin _tw-rounded-full ${borderColors}
 _tw-border-2 _tw-h-[20px] _tw-w-[20px] _tw-mr-3"></div>`;
}

/**
 * Wrap text (best a single character) in a circle to provide information to the user
 * @param {string} content The symbol in the circle, e.g. ? of !
 * @param {string} title The information to display when hovering over the element
 * @param {string} colorClasses The classes to color the content
 * @return {string} A string representation of the circle with content
 */
export function renderInCircle(content: string, title: string, colorClasses: string): string {
    const htmlTitle = title ? `title="${title}"` : "";
    return `<span ${htmlTitle} class="_tw-display-block _tw-font-bold _tw-text-center
    _tw-w-[10px] _tw-h-[10px] _tw-rounded-full _tw-px-1  _tw-mx-1
    _tw-bg-white-500 _tw-border-2 ${colorClasses}">${content}</span>`;
};
