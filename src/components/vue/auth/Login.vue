<template>
    <div class="py-5 px-3">
        <div id="loginForm" class="calc-form mb-3 p-3 rounded border">
            <h1 class="mb-3">Log In</h1>

            <form
                class="mb-4 pb-4 border-bottom needs-validation"
                @submit="signInWithEmail"
                novalidate
                ref="loginForm"
            >
                <div v-if="!loginSuccess">
                    <div class="mb-3">
                        <label for="email" class="form-label"
                            >Email address</label
                        >
                        <input
                            type="email"
                            class="form-control"
                            id="email"
                            v-model="email"
                            required
                        />
                        <div class="invalid-feedback">
                            Please enter a valid email.
                        </div>
                    </div>
                    <div class="mb-4">
                        <label for="password" class="form-label"
                            >Password</label
                        >
                        <input
                            type="password"
                            class="form-control"
                            id="password"
                            min="6"
                            max="32"
                            v-model="password"
                            required
                        />
                        <div class="invalid-feedback">
                            Password must be 6 characters or more.
                        </div>
                    </div>
                    <button
                        type="submit"
                        class="btn btn-outline-light d-block w-100"
                        :disabled="loading"
                    >
                        Login
                    </button>
                </div>
                <div v-else class="alert alert-success mb-0 mt-3">
                    {{ loginSuccess }}
                </div>

                <div v-if="loginError" class="alert alert-danger mb-0 mt-3">
                    {{ loginError }}
                </div>
            </form>

            <button
                v-if="!loading && !siteUser"
                id="googleButton"
                class="btn btn-outline-light w-100 d-block oauth-button"
                @click="signInWithProvider('google')"
            >
                <span id="google-icon" class="icon"></span>
                Continue with Google
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
import { ref, onMounted } from 'vue';
import { supabase } from '../../../lib/supabaseClient.js';
import { Provider } from '@supabase/supabase-js';

const siteUser = ref<any>(null);

const loading = ref<boolean>(false);
const email = ref<string>('');
const password = ref<string>('');
const loginError = ref<string>('');
const loginSuccess = ref<string>('');
const loginForm = ref<HTMLFormElement>();

async function signInWithEmail(event: Event) {
    if (!loginForm.value?.checkValidity()) {
        return;
    }

    event.preventDefault();

    loading.value = true;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'example@email.com',
        password: 'example-password',
    });

    if (error) {
        loginError.value = error.message;
    } else {
        loginSuccess.value = 'Login successfully. Redirecting...';
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    }

    loading.value = false;
}

async function signInWithProvider(provider: Provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });
}
</script>