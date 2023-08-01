export type BodyRelation = {
    name: string;
    value: string;
};
export interface ILagrangeForm {
    relationship: BodyRelation;
    massOne: number;
    massTwo: number;
    distance: number;
}
