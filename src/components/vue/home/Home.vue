<template>
  <div>
    <section class="py-4 py-lg-5 text-center border-bottom">
      <div class="container">
        <div class="row">
          <div class="col-lg-6 col-md-8 mx-auto">
            <div class="d-flex justify-content-center gap-3">
              <img src="/logo.svg" alt="Space Calcs" height="70" width="30" />
              <h1 class="fw-light">Space Calcs</h1>
            </div>

            <p class="lead my-4">
              All the tools you need to calculate your mission to space
            </p>

            <div class="input-group">
              <input
                type="text"
                class="form-control"
                placeholder="Search for a tool"
                aria-label="Search for a tool"
                v-model="search"
              />
            </div>
          </div>
        </div>
        <div class="category-filter mt-3">
          <button
            v-for="category in categories"
            :key="category.slug"
            type="button"
            class="btn mx-2"
            :class="getCategoryClass(category)"
            @click="toggleCategory(category.slug)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>
    </section>

    <CardList :search="search" :active-categories="activeCategories" />
  </div>
</template>

<script setup lang="ts">
import CardList from "./CardList.vue";
import { ref } from "vue";
import type { Category } from "./constants";
import { categories } from "./constants";

const search = ref("");

const activeCategories = ref<string[]>([]);

function toggleCategory(slug: string): void {
  if (activeCategories.value.includes(slug)) {
    activeCategories.value = activeCategories.value.filter(
      (category) => category !== slug
    );
  } else {
    activeCategories.value.push(slug);
  }
}

function getCategoryClass(category: Category): string {
  let btnClasses = [];

  if (activeCategories.value.includes(category.slug)) {
    btnClasses.push("btn-" + category.color);
  } else {
    btnClasses.push("btn-outline-" + category.color);
  }

  return btnClasses.join(" ");
}
</script>
