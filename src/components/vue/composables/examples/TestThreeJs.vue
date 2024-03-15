<template>
	<div ref="container"></div>
</template>

<script setup lang="ts">
import useThreeJS from '../useThreeJS';

const { container } = useThreeJS({ width: 800, height: 600 });
</script>

<style>
/* Add any custom styles for the container here */
#container {
	width: 100%;
	height: 100%;
}
</style>
