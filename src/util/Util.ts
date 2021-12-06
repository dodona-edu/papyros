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

export function addSelectChangeListener<T extends string>(
    selectId: string, onChange: (newValue: T) => void
): void {
    const selectElement = document.getElementById(selectId) as HTMLSelectElement;
    selectElement.addEventListener("change", () => onChange(selectElement.value as T));
}
