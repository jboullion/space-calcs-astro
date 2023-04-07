<template>
  <div class="album py-5 bg-light flex-fill">
    <div class="container">
      <div
        class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3 justify-content-center"
      >
        <div class="col" v-for="calc in filteredCalcs">
          <Calc :calc="calc" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import Calc from "./Calc.vue";
import { calculators } from "./calculator-list";

const props = defineProps<{
  search: string;
  activeCategories: string[];
}>();

const filteredCalcs = computed(() => {
  if (props.activeCategories.length === 0) {
    return calculators.filter(
      (calculator) =>
        calculator.name.toLowerCase().includes(props.search.toLowerCase()) ||
        calculator.description
          .toLowerCase()
          .includes(props.search.toLowerCase())
    );
  }

  return calculators.filter((calculator) => {
    const catList = calculator.categories.map((cat) => cat.slug);
    return (
      props.activeCategories.filter((value) => catList.includes(value)) &&
      (calculator.name.toLowerCase().includes(props.search.toLowerCase()) ||
        calculator.description
          .toLowerCase()
          .includes(props.search.toLowerCase()))
    );
  });
});
</script>
