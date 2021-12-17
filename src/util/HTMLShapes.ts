/* eslint-disable indent */
/* eslint-disable max-len */
export const svgCircle = (id: string, color: string): string => {
    return (
`<svg id="${id}" class="animate-spin mr-3 h-5 w-5 text-white"
xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="${color}" stroke-width="4">
    </circle>
    <path class="opacity-75" fill="${color}"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
    </path>
</svg>`);
};
export const svgTriangle = "";
export const inCircle = (content: string, title?: string): string => {
    return `<span title="${title}" class="display-block font-bold text-center
    w-10 h-10 rounded-full px-1 text-blue-500 bg-white-500 border-blue-500 border-2">${content}</span>`;
};
