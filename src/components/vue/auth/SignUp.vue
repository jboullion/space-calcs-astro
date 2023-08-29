<template>
    <div class="py-5 px-3">
        <div id="" class="login-form mb-5 p-3 rounded border">
            <h1 class="mb-3">Sign Up</h1>

            <form
                v-if="!signupSuccess"
                class="needs-validation mb-3"
                @submit="signUpWithEmail"
                ref="signupForm"
                novalidate
            >
                <div class="mb-3">
                    <EmailInput v-model="email" />
                </div>
                <div class="mb-4">
                    <PasswordInput v-model="password" />
                </div>
                <button
                    type="submit"
                    class="btn btn-outline-light d-block w-100"
                    :disabled="loading"
                >
                    Sign Up
                </button>
            </form>
            <div v-else-if="signupError" class="alert alert-danger mb-0">
                {{ signupError }}
            </div>
            <div v-else class="alert alert-success mb-0 mt-3">
                {{ signupSuccess }}
            </div>
        </div>
        <div id="otherOptions" class="text-center">
            <a href="/login">Log In</a>
            -
            <a href="/forgot">Forgot Password</a>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../../lib/supabaseClient.js';
import { getWithExpiry } from '../utils';
import PasswordInput from '../../auth/PasswordInput.vue';
import EmailInput from '../../auth/EmailInput.vue';

const loading = ref<boolean>(false);
const email = ref<string>('');
const password = ref<string>('');
const signupError = ref<string>('');
const signupSuccess = ref<string>('');
const signupForm = ref<HTMLFormElement>();

onMounted(() => {
    const localSession = getWithExpiry('localSession');
    if (localSession) {
        window.location.href = '/';
    }
});

async function signUpWithEmail(event: Event) {
    if (!signupForm.value?.checkValidity()) {
        return;
    }

    event.preventDefault();

    loading.value = true;

    // user, session,
    const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
    });

    if (error) {
        signupError.value = error.message;
    } else {
        signupSuccess.value = 'Check your email for a confirmation link.';
    }

    loading.value = false;
}
</script>

<style lang="scss"></style>
