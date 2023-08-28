<template>
    <div class="py-5 px-3">
        <div id="loginForm" class="calc-form mb-5 p-3 rounded border">
            <h1 class="mb-3">Sign Up</h1>

            <form
                class="needs-validation mb-3"
                @submit="signUpWithEmail"
                novalidate
                v-if="!signupSuccess"
            >
                <div class="mb-3">
                    <label for="email" class="form-label">Email address</label>
                    <input
                        type="email"
                        class="form-control"
                        id="email"
                        v-model="email"
                        required
                    />
                    <div class="invalid-feedback">
                        Please select a valid email.
                    </div>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
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
                    class="btn btn-primary"
                    :disabled="loading"
                >
                    Sign Up
                </button>
            </form>
            <div v-if="signupSuccess">
                <p>Check your email for a confirmation link.</p>
            </div>
            <div v-if="signupError" class="alert alert-danger mb-0">
                {{ signupError }}
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

const loading = ref<boolean>(false);
const email = ref<string>('');
const password = ref<string>('');
const signupError = ref<string>('');
const signupSuccess = ref<boolean>(false);

async function signUpWithEmail(event: Event) {
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
        signupSuccess.value = true;
    }

    loading.value = false;
}
</script>

<style lang="scss"></style>
