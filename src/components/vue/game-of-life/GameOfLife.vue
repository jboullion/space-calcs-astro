<template>
	<div id="game-of-life__app" class="row">
		<div id="game-of-life__form" class="col-xl-4 col-lg-5 col-md-6">
			<GameOfLifeForm
				:formData="formData"
				@toggle-game="toggleGame"
				@clear-grid="clearGrid"
				@randomize-grid="randomizeGrid"
			/>
		</div>
		<div id="game-of-life__grid" class="col-xl-8 col-lg-7 col-md-6">
			<GameOfLifeGrid :grid="grid" @toggle-cell="toggleCell" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import GameOfLifeForm from './GameOfLifeForm.vue';
import GameOfLifeGrid from './GameOfLifeGrid.vue';
import type { IGameOfLifeForm, Grid } from './types';

const formData = ref<IGameOfLifeForm>({
	gridSize: 20,
	speed: 100,
	isRunning: false,
});

const grid = ref<Grid>([]);
let gameInterval: number | null = null;

const initializeGrid = () => {
	const newGrid: Grid = [];
	for (let i = 0; i < formData.value.gridSize; i++) {
		newGrid.push(Array(formData.value.gridSize).fill(false));
	}
	grid.value = newGrid;
};

const toggleCell = (row: number, col: number) => {
	grid.value[row][col] = !grid.value[row][col];
};

const countNeighbors = (row: number, col: number): number => {
	let count = 0;
	for (let i = -1; i <= 1; i++) {
		for (let j = -1; j <= 1; j++) {
			if (i === 0 && j === 0) continue;
			const newRow = row + i;
			const newCol = col + j;
			if (
				newRow >= 0 &&
				newRow < formData.value.gridSize &&
				newCol >= 0 &&
				newCol < formData.value.gridSize &&
				grid.value[newRow][newCol]
			) {
				count++;
			}
		}
	}
	return count;
};

const updateGrid = () => {
	const newGrid = grid.value.map((row) => [...row]);

	for (let row = 0; row < formData.value.gridSize; row++) {
		for (let col = 0; col < formData.value.gridSize; col++) {
			const neighbors = countNeighbors(row, col);
			if (grid.value[row][col]) {
				newGrid[row][col] = neighbors === 2 || neighbors === 3;
			} else {
				newGrid[row][col] = neighbors === 3;
			}
		}
	}

	grid.value = newGrid;
};

const toggleGame = () => {
	formData.value.isRunning = !formData.value.isRunning;
	if (formData.value.isRunning) {
		gameInterval = setInterval(updateGrid, 1000 / formData.value.speed);
	} else if (gameInterval) {
		clearInterval(gameInterval);
	}
};

const clearGrid = () => {
	grid.value = grid.value.map((row) => row.map(() => false));
};

const randomizeGrid = () => {
	grid.value = grid.value.map((row) => row.map(() => Math.random() > 0.7));
};

onMounted(() => {
	initializeGrid();
});

onUnmounted(() => {
	if (gameInterval) {
		clearInterval(gameInterval);
	}
});
</script>
