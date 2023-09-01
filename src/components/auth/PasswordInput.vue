<template>
    <div>
        <label for="password" class="form-label">Password</label>

        <div class="input-group has-validation">
            <input
                :type="passwordType"
                class="form-control"
                id="password"
                minlength="6"
                maxlength="32"
                :value="modelValue"
                @input="$emit('update:modelValue', $event.target?.value)"
                required
            />
            <button
                type="button"
                class="btn btn-outline-light"
                @click="
                    passwordType =
                        passwordType == 'password' ? 'text' : 'password'
                "
            >
                <i
                    v-if="passwordType == 'text'"
                    class="fa-solid fa-eye-slash fa-fw"
                ></i>
                <i v-else class="fa-solid fa-eye fa-fw"></i>
            </button>
            <div class="invalid-feedback">
                Password must be 6 characters or more.
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const passwordType = ref<'password' | 'text'>('password');

defineProps({
    modelValue: {
        type: String,
        required: true,
    },
});
</script>
