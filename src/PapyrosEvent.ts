export interface PapyrosEvent {
    type: "input"|"output"|"succes"|"error";
    data: string;
}