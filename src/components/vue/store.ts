import { atom } from 'nanostores';
import type { User } from '@supabase/supabase-js';

export const storeUser = atom<User | null>(null);
