<template>
  <div class="form-check form-switch mb-3">
    <input
      :id="id"
      class="form-check-input"
      type="checkbox"
      v-model="model"
      :value="modelValue"
    />
    <label :for="id" class="form-label" v-html="label"></label>
    <tooltip v-if="tooltip" :tooltip="tooltip" />
    <p v-if="description" class="description">
      <small class="text-muted" v-html="description"></small>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Tooltip from "./Tooltip.vue";

const props = defineProps<{
  id: string;
  label: string;
  modelValue: [] | boolean;
  value?: boolean | object;
  tooltip?: string;
  description?: string;
}>();

const emit = defineEmits(["update:modelValue"]);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  },
});
</script>
