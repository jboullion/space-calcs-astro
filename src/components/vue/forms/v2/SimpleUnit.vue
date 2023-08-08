<template>
    <span class="input-group-text bg-dark text-white" v-html="unit"></span>
</template>

<script setup lang="ts">
defineProps<{
    unit: any;
}>();
</script>
