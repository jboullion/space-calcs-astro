<template>
    <div>
        <div v-if="loading">
            <i class="fas fa-spinner fa-pulse"></i>
        </div>
        <button
            v-if="!loading && !siteUser"
            id="googleButton"
            class="google-button oauth-button"
            @click="signIn"
        >
            <span id="google-icon" class="icon"></span>
        </button>
        <div v-if="siteUser">
            <p>Logged in as {{ siteUser.email }}</p>
            <button @click="signOut">Sign Out</button>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../lib/supabaseClient.js';

const siteUser = ref<any>(null);
const loading = ref<boolean>(false);

onMounted(() => {
    // getCountries();
    // getSession();
    // refreshSession();
    getUser();
});

async function signIn() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    window.location.reload();
}

async function getSession() {
    const { data, error } = await supabase.auth.getSession();
}

async function refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    const { session, user } = data;
}

// //https://supabase.com/docs/reference/javascript/auth-setsession
// async function setSession() {
// 	const { data, error } = supabase.auth.setSession({
//     access_token,
//     refresh_token
//   })
// }

async function getUser() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    siteUser.value = user ?? null;
}
</script>

<style>
.oauth-button {
    background: #fff;
    color: rgba(0, 0, 0, 0.54);
    box-shadow: rgba(0, 0, 0, 0.2) 1px 1px 5px 0;
    border-color: transparent;
    text-align: center;
    border-radius: 3px;
    width: 99%;
    height: 39px;
    padding-top: 0;
    margin-bottom: 12px;
    display: block;
    text-decoration: none;
    -webkit-transition: background-color 0.2s ease-in-out 0s,
        border-color 0.2s ease-in-out 0s;
    transition: background-color 0.2s ease-in-out 0s,
        border-color 0.2s ease-in-out 0s;
}

.oauth-button span.icon {
    display: inline-block;
    border-radius: 1px;
    width: 18px;
    height: 18px;
    vertical-align: middle;
}

#google-icon {
    background: url('/images/google-icon.svg') 0 50% no-repeat;
}
</style>
