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

            <div class="row">
              <div class="col-md-6 mb-3">
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Search for a tool"
                    aria-label="Search for a tool"
                    v-model="search"
                  />
                  <span class="input-group-text"
                    ><i class="fas fa-search"></i
                  ></span>
                </div>
              </div>
              <div class="col-md-6 mb-3">
                <select
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
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <CalcList :search="search" :active-categories="activeCategories" />
  </div>
</template>

<script setup lang="ts">
import CalcList from "./CalcList.vue";
import { ref } from "vue";
import type { Category } from "./constants";
import { categories } from "./constants";

const search = ref("");

const activeCategories = ref<string[]>([]);
const selectedCategory = ref<string>("");

function toggleCategory() {
  if (selectedCategory.value === "") {
    activeCategories.value = [];
  } else {
    activeCategories.value = [selectedCategory.value];
  }
}
</script>
