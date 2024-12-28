<template>
	<div class="row">
		<div class="col-xl-4 col-lg-5 col-md-6">
			<SphereControls
				:controls="controls"
				@update:controls="updateControls"
				@toggle-rotation="toggleRotation"
			/>
		</div>
		<div class="col-xl-8 col-lg-7 col-md-6">
			<div
				class="sphere-container"
				@mousemove="handleMouseMove"
				@mousedown="handleMouseDown"
				@mouseup="handleMouseUp"
				@mouseleave="handleMouseUp"
			>
				<div
					class="sphere"
					:style="{
						transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
					}"
				>
					<div
						v-for="cell in cells"
						:key="cell.id"
						class="cell"
						:style="getCellStyle(cell)"
						@click="toggleCell(cell)"
					></div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import SphereControls from './SphereControls.vue';
import type { Cell, ISphereControls } from './types';

const controls = ref<ISphereControls>({
	rotationSpeed: 1,
	radius: 200,
	isRotating: true,
});

const rotation = ref({ x: -20, y: 0 });
const cells = ref<Cell[]>([]);
const isDragging = ref(false);
const lastMousePos = ref({ x: 0, y: 0 });
let animationFrame: number;

// Generate positions for cells on a sphere
const generateCells = () => {
	const newCells: Cell[] = [];
	const rows = 15;
	const cellsPerRow = 20;

	for (let i = 0; i < rows; i++) {
		const phi = (Math.PI * i) / (rows - 1);
		const rowRadius = Math.sin(phi) * controls.value.radius;
		const y = Math.cos(phi) * controls.value.radius;

		for (let j = 0; j < cellsPerRow; j++) {
			const theta = (2 * Math.PI * j) / cellsPerRow;
			const x = rowRadius * Math.cos(theta);
			const z = rowRadius * Math.sin(theta);

			newCells.push({
				id: `cell-${i}-${j}`,
				x: x,
				y: y,
				energy: 0,
				color: '#1a1a1a',
			});
		}
	}
	cells.value = newCells;
};

const getCellStyle = (cell: Cell) => {
	const x = cell.x;
	const y = cell.y;
	const z = Math.sqrt(controls.value.radius ** 2 - x ** 2 - y ** 2);

	return {
		transform: `translate3d(${x}px, ${y}px, ${z}px)`,
		backgroundColor: cell.color,
	};
};

const toggleCell = (cell: Cell) => {
	const index = cells.value.findIndex((c) => c.id === cell.id);
	if (index !== -1) {
		const newCells = [...cells.value];
		newCells[index] = {
			...cell,
			energy: cell.energy === 0 ? 100 : 0,
			color: cell.energy === 0 ? '#4CAF50' : '#1a1a1a',
		};
		cells.value = newCells;
	}
};

const animate = () => {
	if (controls.value.isRotating && !isDragging.value) {
		rotation.value.y += controls.value.rotationSpeed;
	}
	animationFrame = requestAnimationFrame(animate);
};

const handleMouseDown = (event: MouseEvent) => {
	isDragging.value = true;
	lastMousePos.value = { x: event.clientX, y: event.clientY };
};

const handleMouseMove = (event: MouseEvent) => {
	if (isDragging.value) {
		const deltaX = event.clientX - lastMousePos.value.x;
		const deltaY = event.clientY - lastMousePos.value.y;

		rotation.value.y += deltaX * 0.5;
		rotation.value.x = Math.max(
			-90,
			Math.min(90, rotation.value.x + deltaY * 0.5),
		);

		lastMousePos.value = { x: event.clientX, y: event.clientY };
	}
};

const handleMouseUp = () => {
	isDragging.value = false;
};

const updateControls = (newControls: ISphereControls) => {
	controls.value = newControls;
	generateCells();
};

const toggleRotation = () => {
	controls.value.isRotating = !controls.value.isRotating;
};

onMounted(() => {
	generateCells();
	animate();
});

onUnmounted(() => {
	cancelAnimationFrame(animationFrame);
});
</script>

<style>
.sphere-container {
	perspective: 1200px;
	width: 100%;
	height: 600px;
	display: flex;
	justify-content: center;
	align-items: center;
	background: #f0f0f0;
	overflow: hidden;
}

.sphere {
	position: relative;
	transform-style: preserve-3d;
	width: 0;
	height: 0;
	transition: transform 0.1s ease-out;
}

.cell {
	position: absolute;
	width: 20px;
	height: 20px;
	margin: -10px;
	border-radius: 50%;
	background: #1a1a1a;
	transition: background-color 0.3s ease;
	cursor: pointer;
}

.cell:hover {
	transform: scale(1.2);
}
</style>
