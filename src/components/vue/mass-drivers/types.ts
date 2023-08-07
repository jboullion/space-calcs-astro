export interface IMassDriverForm {
    bodyRadius: number; // km
    bodyDensity: number; // Would it be easier to use gravity? g/cm³
    acceleration: number; // g or m/s^2
    exitHeight?: number;
    exitVelocity?: number;
}
