<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../../lib/supabaseClient.js';

import crypto from 'crypto';

const nonce = crypto.randomBytes(16).toString('base64'); // Generate a random nonce
const encoder = new TextEncoder();
const encodedNonce = encoder.encode(nonce); // Encode the nonce
// @ts-ignore
const hash = await crypto.subtle.digest('SHA-256', encodedNonce); // Hash it with SHA-256
const bytes = new Uint8Array(hash);
const hashedNonce = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0')) // Convert the hash to a hexadecimal string
    .join('');

// const countries = ref<any>([]);

// async function getCountries() {
//     const result = await supabase.from('countries').select();
//     if (result && result.data) {
//         countries.value = result.data;
//     }
// }

onMounted(() => {
    //getCountries();
});

async function handleSignInWithGoogle(response: { credential: any }) {
    const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        nonce: hashedNonce, // must be the same one as provided in data-nonce (if any)
    });
}
</script>

<template>
    <div>
        <div
            id="g_id_onload"
            data-client_id="563525421114-em4m5c4kl0q7tbtnpfnl4ecelskcd1qe.apps.googleusercontent.com"
            data-context="signin"
            data-ux_mode="popup"
            data-callback="handleSignInWithGoogle"
            :data-nonce="hashedNonce"
            data-auto_select="true"
            data-itp_support="true"
        ></div>

        <div
            class="g_id_signin"
            data-type="standard"
            data-shape="pill"
            data-theme="outline"
            data-text="signin_with"
            data-size="large"
            data-logo_alignment="left"
        ></div>
    </div>
</template>
