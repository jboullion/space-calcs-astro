<template>
    <div class="py-5 px-3">
        <div id="" class="login-form mb-5 p-3 rounded border">
            <h1 class="mb-3">Update Password</h1>

            <form
                v-if="!forgotSuccess"
                class="needs-validation"
                @submit="updatePassword"
                novalidate
                ref="updateForm"
            >
                <div class="mb-4">
                    <PasswordInput v-model="newPassword" />
                </div>
                <button
                    type="submit"
                    class="btn btn-outline-light d-block w-100"
                    :disabled="loading"
                >
                    Update Password
                </button>
            </form>
            <div v-else-if="forgotError" class="alert alert-danger mb-0 mt-3">
                {{ forgotError }}
            </div>
            <div v-else class="alert alert-success mb-0 mt-3">
                {{ forgotSuccess }}
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../../lib/supabaseClient.js';
import { getWithExpiry } from '../utils';
import PasswordInput from './PasswordInput.vue';

const loading = ref<boolean>(false);
const newPassword = ref<string>('');
const forgotError = ref<string>('');
const forgotSuccess = ref<string>('');
const updateForm = ref<HTMLFormElement>();

onMounted(() => {
    const localSession = getWithExpiry('localSession');
    if (localSession) {
        window.location.href = '/';
    }
});

async function updatePassword(event: Event) {
    if (!updateForm.value?.checkValidity()) {
        event.preventDefault();
        return;
    }

    event.preventDefault();

    loading.value = true;

    const { data, error } = await supabase.auth.updateUser({
        password: newPassword.value,
    });

    if (error) {
        forgotError.value = error.message;
    } else {
        forgotSuccess.value = 'Password updated successfully. Redirecting...';
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    }

    loading.value = false;
}
</script>

<style lang="scss"></style>
