<template>
    <div>
        <label for="email" class="form-label">Email address</label>
        <input
            type="email"
            class="form-control"
            id="email"
            :value="modelValue"
            @input="
                $emit(
                    'update:modelValue',
                    ($event.target as HTMLInputElement).value,
                )
            "
            required
        />
        <div class="invalid-feedback">Please enter a valid email.</div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps({
    modelValue: {
        type: String,
        required: true,
    },
});
</script>
