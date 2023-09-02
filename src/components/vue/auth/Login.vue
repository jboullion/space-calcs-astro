<template>
    <div class="py-5 px-3">
        <div id="" class="login-form mb-3 p-3 rounded border">
            <h1 class="mb-3">Log In</h1>

            <form
                class="mb-4 pb-4 border-bottom needs-validation"
                @submit="signInWithEmail"
                novalidate
                ref="loginForm"
            >
                <div v-if="!loginSuccess">
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
                        Login
                    </button>
                </div>
                <div
                    v-else-if="loginError"
                    class="alert alert-danger mb-0 mt-3"
                >
                    {{ loginError }}
                </div>
                <div v-else class="alert alert-success mb-0 mt-3">
                    {{ loginSuccess }}
                </div>
            </form>

            <button
                v-if="!loading && !siteUser"
                id="googleButton"
                class="btn btn-outline-light w-100 d-block oauth-button mb-3"
                @click="signInWithProvider('google')"
            >
                <span id="google-icon" class="icon"></span>
                Continue with Google
            </button>
            <button
                v-if="!loading && !siteUser"
                id="discordButton"
                class="btn btn-outline-light w-100 d-block oauth-button mb-3"
                @click="signInWithProvider('discord')"
            >
                <span id="discord-icon" class="icon"></span>
                Continue with Discord
            </button>

            <button
                v-if="!loading && !siteUser"
                id="githubButton"
                class="btn btn-outline-light w-100 d-block oauth-button mb-3"
                @click="signInWithProvider('github')"
            >
                <span id="github-icon" class="icon"></span>
                Continue with GitHub
            </button>
        </div>
        <div id="otherOptions" class="text-center">
            <a href="/signup">Sign Up</a>
            -
            <a href="/forgot">Forgot Password</a>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeMount } from 'vue';
import { supabase } from '../../../lib/supabaseClient.js';
import type { Provider } from '@supabase/supabase-js';
import { getWithExpiry } from '../utils';
import PasswordInput from './PasswordInput.vue';
import EmailInput from './EmailInput.vue';

const siteUser = ref<any>(null);

const loading = ref<boolean>(false);
const email = ref<string>('');
const password = ref<string>('');
const loginError = ref<string>('');
const loginSuccess = ref<string>('');
const loginForm = ref<HTMLFormElement>();

onMounted(() => {
    const localSession = getWithExpiry('localSession');
    if (localSession) {
        window.location.href = '/';
    }
});

async function signInWithEmail(event: Event) {
    if (!loginForm.value?.checkValidity()) {
        return;
    }

    event.preventDefault();

    loading.value = true;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
    });

    if (error) {
        loginError.value = error.message;
    } else {
        loginSuccess.value = 'Login successfully. Redirecting...';
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }

    loading.value = false;
}

async function signInWithProvider(provider: Provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: window.location.origin,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });
}
</script>
