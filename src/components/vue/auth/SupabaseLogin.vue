<template>
	<div>
		<a v-if="!siteUser" href="/login" class="btn btn-dark fs-4"
			><i class="fa-solid fa-right-to-bracket fa-fw"></i
		></a>
		<div v-else>
			<a href="/account" class="btn btn-dark fs-4"
				><i class="fa-solid fa-user fa-fw"></i
			></a>
			<button class="btn btn-dark fs-4" @click="signOut">
				<i class="fa-solid fa-right-from-bracket fa-fw"></i>
			</button>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import {
	getUser,
	refreshSession,
	signOut,
} from '../../../lib/supabaseClient.js';
import { getWithExpiry, setWithExpiry } from '../utils.js';
import type { User } from '@supabase/supabase-js';

import { storeUser } from '../../../utils/store';

const siteUser = ref<User | null>(null);

onBeforeMount(async () => {
	const localSession = getWithExpiry('localSession');

	if (localSession) {
		siteUser.value = { ...localSession };

		refreshSession();
	} else {
		siteUser.value = await getUser();
	}

	if (siteUser.value) {
		storeUser.set(siteUser.value);
	}
});
</script>
