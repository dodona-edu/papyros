/* eslint-disable indent */
/* eslint-disable max-len */

/**
 * Draw a circle using an HTML svg element
 * @param {string} id HTML id for this element
 * @param {string} color The color of the circle
 * @return {string} A string representation of the circle
 */
export const svgCircle = (id: string, color: string): string => {
    return (
`<svg id="${id}" class="_tw-animate-spin _tw-mr-3 _tw-h-5 _tw-w-5 _tw-text-white"
xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle class="_tw-opacity-25" cx="12" cy="12" r="10" stroke="${color}" stroke-width="4">
    </circle>
    <path class="_tw-opacity-75" fill="${color}"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
    </path>
</svg>`);
};

/**
 * Wrap text (best a single character) in a circle to provide information to the user
 * @param {string} content The symbol in the circle, e.g. ? of !
 * @param {string} title The information to display when hovering over the element
 * @param {string} colorClasses The classes to color the content
 * @return {string} A string representation of the circle with content
 */
export const inCircle = (content: string, title: string, colorClasses: string): string => {
    const htmlTitle = title ? `title="${title}"`: "";
    return `<span ${htmlTitle} class="_tw-display-block _tw-font-bold _tw-text-center
    _tw-w-[10px] _tw-h-[10px] _tw-rounded-full _tw-px-1  _tw-mx-1
    _tw-bg-white-500 _tw-border-2 ${colorClasses}">${content}</span>`;
};
