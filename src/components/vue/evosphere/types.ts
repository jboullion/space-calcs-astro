export interface Cell {
	id: string;
	x: number;
	y: number;
	energy: number;
	color: string;
}

export interface ISphereControls {
	rotationSpeed: number;
	radius: number;
	isRotating: boolean;
}
