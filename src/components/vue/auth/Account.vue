<template>
    <div class="py-5 px-3">
        <h1 class="mb-3">Account</h1>

        <div class="alert alert-warning mb-4">
            <i class="fa-solid fa-exclamation-triangle"></i> More features
            coming!
        </div>

        <div class="row">
            <div class="col-sm-6">
                <div class="login-form mb-5 p-3 rounded border">
                    <table class="table table-borderless mb-0">
                        <tbody>
                            <tr>
                                <th>Email</th>
                                <td>{{ siteUser?.email }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="col-sm-6">
                <div
                    v-show="showUpdatePassword"
                    class="calc-form mb-5 p-3 rounded border"
                >
                    <h2>Update Password</h2>
                    <form
                        v-if="!updatePasswordSuccess"
                        class="needs-validation"
                        @submit="updatePassword"
                        novalidate
                        ref="updatePasswordForm"
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
                    <div
                        v-else-if="updatePasswordError"
                        class="alert alert-danger mb-0 mt-3"
                    >
                        {{ updatePasswordError }}
                    </div>
                    <div v-else class="alert alert-success mb-0 mt-3">
                        {{ updatePasswordSuccess }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { computed, onBeforeMount, onMounted, ref } from 'vue';
import { getWithExpiry } from '../utils';
import { getUser, supabase } from '../../../lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import PasswordInput from '../../auth/PasswordInput.vue';

const loading = ref<boolean>(false);
const newPassword = ref<string>('');
const updatePasswordError = ref<string>('');
const updatePasswordSuccess = ref<string>('');
const updatePasswordForm = ref<HTMLFormElement>();

const siteUser = ref<User | null>(null);

// Only show update password form if user is using email/password
const showUpdatePassword = computed(() => {
    return siteUser.value?.app_metadata.provider === 'email';
});

onBeforeMount(async () => {
    const localSession = getWithExpiry('localSession');

    if (localSession) {
        siteUser.value = { ...localSession };
    } else {
        siteUser.value = await getUser();
    }

    if (!siteUser.value) {
        window.location.href = '/login';
    }
});

async function updatePassword(event: Event) {
    if (!updatePasswordForm.value?.checkValidity()) {
        return;
    }

    event.preventDefault();

    loading.value = true;

    const { data, error } = await supabase.auth.updateUser({
        password: newPassword.value,
    });

    if (error) {
        updatePasswordError.value = error.message;
    } else {
        updatePasswordSuccess.value = 'Password updated successfully.';
        setTimeout(() => {
            updatePasswordSuccess.value = '';
        }, 5000);
    }

    loading.value = false;
}
</script>
