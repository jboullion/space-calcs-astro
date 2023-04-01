<template>
  <div class="mb-3">
    <label :for="id" class="form-label" v-html="label"></label>
    <tooltip v-if="tooltip" :tooltip="tooltip" />
    <select
      :id="id"
      class="form-select"
      :value="modelValue"
      @change="($event) => $emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
      <option v-for="option in options" :value="option">
        {{ option.name }}
      </option>
    </select>
    <p v-if="description" class="description">
      <small class="text-muted" v-html="description"></small>
    </p>
  </div>
</template>

<script setup lang="ts">
import Tooltip from "./Tooltip.vue";

// type SelectOption = {
//   name: string;
//   value: number;
// };

defineEmits(["update:modelValue"]);

defineProps<{
  id: string;
  label: string;
  modelValue: any;
  unit?: string;
  tooltip?: string;
  description?: string;
  options: any[];
}>();
</script>
