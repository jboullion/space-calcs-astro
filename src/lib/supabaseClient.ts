import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { getWithExpiry, setWithExpiry } from '../components/vue/utils';
import type { Database, CalculatorRow } from '../services/database.types';

import { useStore } from '@nanostores/vue';
import { storeUser } from '../utils/store';

// read the store value with the `useStore` hook
const $user = useStore(storeUser);

const localSessionDuration = 1000 * 60 * 60;

// Use Vite environment variables instead of imported constants
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

console.log(supabaseUrl, supabaseAnonKey);

// Near the beginning of your supabaseClient.ts
console.log('ENV Variables:', {
	SUPABASE_URL: supabaseUrl,
	SUPABASE_ANON_KEY: supabaseAnonKey,
});

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
	console.error(
		'Missing Supabase environment variables. Check your .env file.',
	);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function signOut() {
	const { error } = await supabase.auth.signOut();
	localStorage.removeItem('localSession');
	localStorage.removeItem('lastRefresh');
	window.location.href = '/';
}

// Rest of the file remains the same...
export async function getSession() {
	const { data, error } = await supabase.auth.getSession();
	return data;
}

export async function refreshSession() {
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
		localStorage.setItem('lastSession', new Date().getTime().toString());
	}
}

export async function getUser(): Promise<User | null> {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const returnUser: User | null = user ?? null;

	if (returnUser) {
		setWithExpiry('localSession', returnUser, localSessionDuration);
	}

	return returnUser;
}

async function localStoreCalcs(calculatorId: string) {
	// Supabase with only return data that the authenticated user has access to
	const { data, error } = await supabase
		.from('calculators')
		.select()
		.eq('calculator_id', calculatorId);

	if (data) {
		setWithExpiry('calcSaves' + calculatorId, data, localSessionDuration);
	}

	return data;
}

export async function getCalculatorSaves(
	calculatorId: string,
): Promise<CalculatorRow[] | null> {
	const localData = getWithExpiry('calcSaves' + calculatorId);

	if (localData) return localData;

	return await localStoreCalcs(calculatorId);
}

export async function updateSavedCalculators(
	data: any,
	saveName: string,
	calculatorId: string,
	version: number = 1,
) {
	if (!$user.value) return;

	const cleanName = saveName.trim().substring(0, 50);

	// TODO: For now only save one row per user. In future / pro users might save more
	const { error } = await supabase.from('calculators').upsert({
		data: data,
		name: cleanName,
		user_id: $user.value.id,
		calculator_id: calculatorId,
		version: version,
	});

	// Resave our calculators to local storage
	await localStoreCalcs(calculatorId);
}
