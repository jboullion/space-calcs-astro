<template>
  <BaseModal @close="emit('close')">
    <template #header>
      <h5 class="modal-title" id="foodModalLabel">{{ food.name }}</h5>
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        @click="emit('close')"
      ></button>
    </template>
    <div class="food__info">
      <table class="table table-striped">
        <tbody>
          <tr class="food__nutrients" v-for="nutrient in orderedNutrients">
            <th>{{ nutrient.nutrientName }}</th>
            <td>
              {{ nutrient.value.toLocaleString()
              }}{{ nutrient.unitName.toLowerCase() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
// TODO: This is a hijacked bootstrap modal. Might be nice to use something more custom.
import { computed } from "vue";
import type { Food } from "./types";
import BaseModal from "../shared/BaseModal.vue";

const props = defineProps<{
  food: Food;
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const orderedNutrients = computed(() => {
  return props.food?.nutrients.sort((a, b) => {
    if (a.nutrientName < b.nutrientName) {
      return -1;
    }
    if (a.nutrientName > b.nutrientName) {
      return 1;
    }
    return 0;
  });
});
</script>

<style></style>
