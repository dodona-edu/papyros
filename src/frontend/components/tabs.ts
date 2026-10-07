/**
 * The tab to move to for an arrow, Home or End key in an ARIA tablist, wrapping around at
 * both ends; undefined for any other key.
 */
export function nextTabIndex(key: string, current: number, count: number): number | undefined {
    switch (key) {
        case "ArrowLeft":
            return (current - 1 + count) % count;
        case "ArrowRight":
            return (current + 1) % count;
        case "Home":
            return 0;
        case "End":
            return count - 1;
        default:
            return undefined;
    }
}
