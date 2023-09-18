<template>
	<div class="album pt-3 pb-5 flex-fill">
		<div class="container">
			<div class="row">
				<div class="col-md-4 relative">
					<div id="calcFilters" class="mb-4">
						<div class="input-group mb-4">
							<input
								type="text"
								class="form-control"
								placeholder="Search Tools"
								aria-label="Search Tools"
								v-model="search"
							/>
							<span class="input-group-text"
								><i class="fas fa-search"></i
							></span>
						</div>

						<select
							class="form-select"
							placeholder="Select Category"
							aria-label="Select Category"
							v-model="selectedCategory"
							@change="toggleCategory()"
						>
							<option value="" selected>
								- All Categories -
							</option>
							<option
								v-for="category in categories"
								:key="category.slug"
								:value="category.slug"
							>
								{{ category.name }}
							</option>
						</select>
					</div>
					<div class="list-group">
						<button
							type="button"
							v-for="tool in sortedTools"
							:key="tool.id"
							class="list-group-item list-group-item-action"
						>
							{{ tool.name }}
						</button>
					</div>
				</div>
				<div class="col-lg-9 col-md-8">
					<!-- <Tool
								v-for="tool in sortedTools"
								:key="tool.id"
								:calc="tool"
							/> -->
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';

import { calculators } from '../../../utils/calculator-list';
import { categories, tools } from './constants';

const search = ref<string>('');

const selectedCategory = ref<string>('');

const sortedTools = computed(() => {
	return tools.sort((a, b) => {
		return a.name.localeCompare(b.name);
	});
});

function toggleCategory() {
	if (selectedCategory.value !== '') {
		const category = categories.value.find(
			(category) => category.slug === selectedCategory.value,
		);
	}
}
const filteredCalcs = computed(() => {
	if (selectedCategory.value === '') {
		return calculators.filter(
			(calculator) =>
				calculator.name
					.toLowerCase()
					.includes(search.value.toLowerCase()) ||
				calculator.description
					.toLowerCase()
					.includes(search.value.toLowerCase()),
		);
	}

	return calculators.filter((calculator) => {
		const catList = calculator.categories.map((cat) => cat.slug);

		const hasIntersection = catList.includes(selectedCategory.value);

		return (
			hasIntersection &&
			(calculator.name
				.toLowerCase()
				.includes(search.value.toLowerCase()) ||
				calculator.description
					.toLowerCase()
					.includes(search.value.toLowerCase()))
		);
	});
});
</script>

<style scoped></style>
