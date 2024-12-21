<template>
	<div class="game-grid">
		<div v-for="(row, rowIndex) in grid" :key="rowIndex" class="game-row">
			<div
				v-for="(cell, colIndex) in row"
				:key="colIndex"
				class="game-cell"
				:class="{ alive: cell }"
				@click="$emit('toggle-cell', rowIndex, colIndex)"
			></div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Grid } from './types';

defineProps<{
	grid: Grid;
}>();

defineEmits<{
	(e: 'toggle-cell', row: number, col: number): void;
}>();
</script>

<style>
.game-grid {
	display: inline-block;
	border: 1px solid #ccc;
	background: #f5f5f5;
	padding: 2px;
}

.game-row {
	display: flex;
}

.game-cell {
	width: 20px;
	height: 20px;
	border: 1px solid #ddd;
	background: white;
	margin: 1px;
	cursor: pointer;
}

.game-cell.alive {
	background: #333;
}
</style>
