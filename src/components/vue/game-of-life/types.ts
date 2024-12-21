export interface IGameOfLifeForm {
	gridSize: number;
	speed: number;
	isRunning: boolean;
}

export type GridCell = boolean;
export type Grid = GridCell[][];
