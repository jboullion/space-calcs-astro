<template>
  <div class="mb-3">
    <label :for="id" class="form-label" v-html="label"></label>
    <tooltip v-if="tooltip" :tooltip="tooltip" />
    <div class="input-group">
      <input
        :id="id"
        type="number"
        class="form-control"
        :value.number="modelValue"
        :min="min"
        :max="max"
        :step="step"
        @change="($event) => $emit('update:modelValue', parseFloat(($event.target as HTMLInputElement).value))"
      />
      <span v-if="unit" class="input-group-text bg-dark text-white">{{
        unit
      }}</span>
    </div>
    <p v-if="description" class="description">
      <small class="text-muted" v-html="description"></small>
    </p>
  </div>
</template>

<script setup lang="ts">
import Tooltip from "./Tooltip.vue";

defineEmits(["update:modelValue"]);

defineProps<{
  id: string;
  label: string;
  modelValue: number;
  unit?: string;
  tooltip?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}>();
</script>
