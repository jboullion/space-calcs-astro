<template>
  <div class="card shadow-sm h-100">
    <a :href="tool.link" class="card-body d-flex flex-column">
      <h2 class="card-title fw-bold">{{ tool.name }}</h2>
      <p class="card-text flex-fill">{{ tool.description }}</p>
      <div class="d-flex justify-content-between align-items-center">
        <small :class="'text-' + tool.category.color">{{
          tool.category.name
        }}</small>
      </div>
    </a>
  </div>
</template>

<script setup lang="ts">
import type { SpaceTool } from "../../../types/types";

defineProps<{
  tool: SpaceTool;
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
