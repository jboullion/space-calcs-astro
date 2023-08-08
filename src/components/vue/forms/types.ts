export interface Units {
    label: string;
    value: number;
}
export interface NumberUnits extends Units {
    step?: number;
}
