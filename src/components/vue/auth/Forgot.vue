<template>
    <div class="py-5 px-3">
        <div id="" class="login-form mb-5 p-3 rounded border">
            <h1 class="mb-3">Forgot Password</h1>

            <form
                v-if="!forgotSuccess"
                class="needs-validation"
                @submit="forgotPassword"
                novalidate
                ref="forgotForm"
            >
                <div class="mb-4">
                    <EmailInput v-model="email" />
                </div>
                <button
                    type="submit"
                    class="btn btn-outline-light d-block w-100"
                    :disabled="loading"
                >
                    Send Reset
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
import { onMounted, ref } from 'vue';
import { supabase } from '../../../lib/supabaseClient.js';
import { getWithExpiry } from '../utils';
import EmailInput from './EmailInput.vue';

const loading = ref<boolean>(false);
const email = ref<string>('');
const forgotError = ref<string>('');
const forgotSuccess = ref<string>('');
const forgotForm = ref<HTMLFormElement>();

onMounted(() => {
    const localSession = getWithExpiry('localSession');
    if (localSession) {
        window.location.href = '/';
    }
});

async function forgotPassword(event: Event) {
    if (!forgotForm.value?.checkValidity()) {
        return;
    }

    event.preventDefault();

    loading.value = true;

    const { data, error } = await supabase.auth.resetPasswordForEmail(
        email.value,
        { redirectTo: window.location.origin + '/update-password' },
    );

    if (error) {
        forgotError.value = error.message;
    } else {
        forgotSuccess.value = 'Check your email for a reset link.';
    }

    loading.value = false;
}
</script>
