import { User, createClient } from '@supabase/supabase-js';
import { setWithExpiry } from '../components/vue/utils';
import { SUPA_PROJECT_URL, SUPA_ANON_PUBLIC } from '../utils/public-variables';
import type { Database, FlyWheelRow } from '../services/database.types';

const localSessionDuration = 1000 * 60 * 10;

export const supabase = createClient<Database>(
    SUPA_PROJECT_URL,
    SUPA_ANON_PUBLIC,
);

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    localStorage.removeItem('localSession');
    localStorage.removeItem('lastRefresh');
    window.location.href = '/';
}

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
        localStorage.setItem('localSession', new Date().getTime().toString());
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

export async function getCalculatorSaves(
    calculatorId: string,
): Promise<FlyWheelRow[] | null> {
    // Supabase with only return data that the authenticated user has access to
    const { data, error } = await supabase
        .from('calculators')
        .select()
        .eq('calculator_id', calculatorId);

    return data;
}
