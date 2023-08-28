<template>
    <div class="py-5 px-3">
        <div id="loginForm" class="calc-form mb-5 p-3 rounded border">
            <h1 class="mb-3">Update Password</h1>

            <form class="needs-validation" @submit="updatePassword" novalidate>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input
                        type="password"
                        class="form-control"
                        id="password"
                        min="6"
                        max="32"
                        v-model="newPassword"
                        required
                    />
                    <div class="invalid-feedback">
                        Password must be 6 characters or more.
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">
                    Update Password
                </button>
            </form>
            <div v-if="forgotError" class="alert alert-danger mb-0 mt-3">
                {{ forgotError }}
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../../lib/supabaseClient.js';

const loading = ref<boolean>(false);
const newPassword = ref<string>('');
const forgotError = ref<string>('');
const forgotSuccess = ref<boolean>(false);

async function updatePassword(event: Event) {
    event.preventDefault();

    loading.value = true;

    const { data, error } = await supabase.auth.updateUser({
        password: newPassword.value,
    });

    if (error) {
        forgotError.value = error.message;
    } else {
        forgotSuccess.value = true;
    }

    loading.value = false;
}
</script>

<style lang="scss"></style>
