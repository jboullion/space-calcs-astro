<template>
  <div class="mb-3">
    <label :for="id" class="form-label" v-html="label"></label>
    <tooltip v-if="tooltip" :tooltip="tooltip" />
    <select
      :id="id"
      class="form-select"
      :value="modelValue.name"
      @change="($event) => emitOption(($event.target as HTMLInputElement).value)"
    >
      <option v-for="option in options" :value="option.name">
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

const emit = defineEmits(["update:modelValue"]);

const props = defineProps<{
  id: string;
  label: string;
  modelValue: any;
  unit?: string;
  tooltip?: string;
  description?: string;
  options: any[];
}>();

function emitOption(value?: any) {
  const result = props.options.find((option) => option.name === value);
  emit("update:modelValue", result);
}
</script>
