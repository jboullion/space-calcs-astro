<template>
    <div class="mb-3">
        <label v-if="label" :for="id" class="form-label" v-html="label"></label>
        <Tooltip v-if="tooltip" :tooltip="tooltip" />
        <div class="input-group">
            <span
                v-if="prefix"
                class="input-group-text bg-dark text-white"
                v-html="prefix"
            ></span>
            <slot name="input"></slot>
            <slot name="unit"></slot>
        </div>
        <p v-if="description" class="description">
            <small class="text-muted" v-html="description"></small>
        </p>
    </div>
</template>

<script setup lang="ts">
import Tooltip from '../Tooltip.vue';

defineProps<{
    id: string;
    label: string;
    prefix?: string;
    tooltip?: string;
    description?: string;
}>();
</script>

<style>
.calc-form .input-group input {
    width: auto;
    flex: 2;
}

.calc-form .input-group input + select,
.calc-form .input-group input + span {
    flex: 1;
}
</style>
