export interface PapyrosEvent {
    type: "input"|"output"|"script"|"succes"|"error";
    data: string;
}