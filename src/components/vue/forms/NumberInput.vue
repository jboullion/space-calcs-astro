<template>
  <div class="mb-3">
    <label :for="id" class="form-label" v-html="label"></label>
    <tooltip v-if="tooltip" :tooltip="tooltip" />
    <div class="input-group">
      <input
        :id="id"
        type="number"
        class="form-control"
        v-model.number="vModel"
        :min="min"
        :max="max"
        @change="($event) => changeFn"
      />
      <span v-if="unit" class="input-group-text">{{ unit }}</span>
    </div>
    <p v-if="description" class="description">
      <small class="text-muted" v-html="description"></small>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Tooltip from "./Tooltip.vue";

const props = defineProps({
  id: String,
  label: String,
  vModel: Number,
  unit: String,
  changeFn: Function,
  tooltip: String,
  description: String,
  min: Number,
  max: Number,
});
</script>
