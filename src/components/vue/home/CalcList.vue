<template>
	<div class="album pt-0 pb-5 flex-fill">
		<div class="container">
			<div class="row">
				<div class="col-xxl-8 col-xl-9 col-lg-10 m-auto">
					<div class="row">
						<div class="col-lg-3 col-md-4 relative">
							<div id="calcFilters" class="pt-0 pt-md-5">
								<div class="input-group mb-3">
									<input
										type="text"
										class="form-control"
										placeholder="Search Calcs"
										aria-label="Search Calcs"
										v-model="search"
									/>
									<span class="input-group-text"
										><i class="fas fa-search"></i
									></span>
								</div>

								<!-- <select
									class="form-select"
									placeholder="Select Category"
									aria-label="Select Category"
									v-model="selectedCategory"
									@change="toggleCategory()"
								>
									<option value="" selected>All</option>
									<option
										v-for="category in categories"
										:key="category.slug"
										:value="category.slug"
									>
										{{ category.name }}
									</option>
								</select> -->

								<div
									class="form-check form-switch"
									v-for="category in categories"
									:key="category.slug"
								>
									<label
										class="form-check-label"
										:for="category.slug + 'Toggle'"
										><i
											class="fa-solid fa-fw me-1"
											:class="[
												category.icon,
												'text-' + category.color,
											]"
										></i>
										{{ category.name }}</label
									>
									<input
										class="form-check-input"
										type="checkbox"
										role="switch"
										:value="category"
										:id="category.slug + 'Toggle'"
										v-model="activeCategories"
									/>
								</div>
							</div>
						</div>
						<div class="col-lg-9 col-md-8 pt-5">
							<a
								:href="calc.link"
								class="card mb-3"
								v-for="calc in filteredCalcs"
								:key="calc.id"
							>
								<h5
									class="card-header d-flex justify-content-between"
								>
									{{ calc.name }}

									<span class="fs-6"
										><small
											class="text-body-secondary ms-2"
											v-for="cat in calc.categories"
										>
											<i
												class="fa-solid fa-fw"
												:class="[
													cat.icon,
													'text-' + cat.color,
												]"
											></i> </small
									></span>
								</h5>
								<div
									class="card-body bg-black d-flex justify-content-between"
								>
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
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';

import { calculators } from '../../../utils/calculator-list';
import { categories } from './constants';
import type { Category } from './constants';

const search = ref<string>('');
const activeCategories = ref<Category[]>([]);

const filteredCalcs = computed(() => {
	if (activeCategories.value.length === 0) {
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

		const intersection = activeCategories.value.filter((value) =>
			catList.includes(value.slug),
		);

		return (
			intersection.length &&
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

<style scoped>
#calcFilters {
	position: sticky;
	top: 0;
}
.form-check.form-switch {
	display: flex;
	justify-content: space-between;
	padding: 0;
	margin-bottom: 5px;
	align-items: center;
}

.form-check.form-switch input {
	cursor: pointer;
}

.form-check.form-switch label {
	flex: 1;
	cursor: pointer;
	padding: 4px 0;
}
</style>
