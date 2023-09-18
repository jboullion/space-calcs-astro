<template>
	<a :href="calc.link" class="card mb-3" :key="calc.id">
		<h5 class="card-header d-flex justify-content-between">
			{{ calc.name }}

			<span class="fs-6"
				><small
					class="text-body-secondary ms-2"
					v-for="cat in calc.categories"
				>
					<i
						class="fa-solid fa-fw"
						:class="[cat.icon, 'text-' + cat.color]"
					></i> </small
			></span>
		</h5>
		<div class="card-body bg-black d-flex justify-content-between">
			<p class="card-text">
				{{ calc.description }}
			</p>
			<img
				v-if="calc.sponsorImg"
				:src="calc.sponsorImg"
				:alt="calc.sponsor"
				:title="calc.sponsor"
				class="rounded-circle ms-3"
				width="50"
				height="50"
			/>
		</div>
	</a>
</template>

<script setup lang="ts">
import type { SpaceCalc } from '../../../types/types';

defineProps<{
	calc: SpaceCalc;
}>();
</script>

<style>
a {
	color: inherit;
	text-decoration: none;
}

h2.card-title {
	font-size: 1.4rem;
}

.card:hover {
	box-shadow: 0px 3px 5px 0px rgba(0, 0, 0, 0.2) !important;
	transition: all 0.3s ease;
}
</style>
