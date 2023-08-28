<template>
    <div>
        <a v-if="!siteUser" href="/login" class="btn btn-dark fs-4"
            ><i class="fa-solid fa-right-to-bracket fa-fw"></i
        ></a>
        <div v-else>
            <a href="/account" class="btn btn-dark fs-4" style="height: 50px"
                ><i class="fa-solid fa-user fa-fw"></i
            ></a>
            <button class="btn btn-dark fs-4" @click="signOut">
                <i class="fa-solid fa-right-from-bracket fa-fw"></i>
            </button>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../lib/supabaseClient.js';
import { getWithExpiry, setWithExpiry } from '../vue/utils.js';

const siteUser = ref<any>(null);
const localSessionDuration = 1000 * 60 * 5;

onMounted(async () => {
    const localSession = getWithExpiry('localSession');

    if (localSession) {
        siteUser.value = { ...localSession };
        refreshSession();
    } else {
        await getUser();
    }
});

async function signOut() {
    const { error } = await supabase.auth.signOut();
    window.location.reload();
}

// async function getSession() {
//     const { data, error } = await supabase.auth.getSession();
// }

async function refreshSession() {
    const refresh = localStorage.getItem('lastRefresh');

    // Only refresh session once every 5 minutes
    if (refresh) {
        const now = new Date().getTime();
        const diff = now - parseInt(refresh);

        if (diff > localSessionDuration) {
            const { data, error } = await supabase.auth.refreshSession();
            const { session, user } = data;

            localStorage.setItem(
                'lastRefresh',
                new Date().getTime().toString(),
            );
        }
    } else {
        const { data, error } = await supabase.auth.refreshSession();
        //const { session, user } = data;
        localStorage.setItem('localSession', new Date().getTime().toString());
    }
}

async function getUser() {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    siteUser.value = user ?? null;

    setWithExpiry('localSession', siteUser.value, localSessionDuration);
}
</script>
