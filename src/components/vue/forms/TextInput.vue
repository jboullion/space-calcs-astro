<template>
  <div>
    <label :for="id" class="form-label">
      {{ label }}
      <i
        class="fas fa-question-circle"
        v-if="tooltip"
        data-toggle="tooltip"
        data-placement="top"
        :title="tooltip"
      ></i>
    </label>
    <div class="input-group">
      <slot name="prepend"></slot>

      <input
        :id="id"
        :name="id"
        class="form-control"
        v-bind="$attrs"
        :value="modelValue"
        @input="
          $emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
      />

      <slot name="append"></slot>
    </div>
    <p v-if="description" class="description">
      <small class="text-muted">{{ description }}</small>
    </p>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  modelValue: string | number;
  id: string;
  label: string;
  tooltip?: string;
  description?: string;
}>();

defineEmits<{
  "update:modelValue": (value: string | number) => void;
}>();
</script>
