<template>
    <div>
        <button @click="signIn" class="btn btn-primary">Sign In</button>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../../lib/supabaseClient.js';

import crypto from 'crypto';

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

// async function handleSignInWithGoogle(response: { credential: any }) {
//     const { data, error } = await supabase.auth.signInWithIdToken({
//         provider: 'google',
//         token: response.credential,
//         nonce: hashedNonce, // must be the same one as provided in data-nonce (if any)
//     });
// }

async function signIn() {
    console.log('signIn');

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
</script>
