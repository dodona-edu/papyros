export function getSelectOptions<T>(
    options: Array<T>, selected: T, optionText: (option: T) => string): string {
    return options.map(option => {
        const selectedValue = selected === option ? "selected" : "";
        return `
            <option ${selectedValue} value="${option}">
                ${optionText(option)}
            </option>
        `;
    }).join("\n");
}

export function addListener<T extends string>(
    elementId: string, onEvent: (e: T) => void, eventType = "change", attribute = "value"
): void {
    const element = document.getElementById(elementId) as HTMLElement;
    element.addEventListener(eventType, () => {
        onEvent((element as any)[attribute] || element.getAttribute(attribute) as T);
    });
}

