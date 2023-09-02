// We are using "Nano Stores" for state management
// Link: https://github.com/nanostores/nanostores

import { atom } from 'nanostores';
import type { User } from '@supabase/supabase-js';

export const storeUser = atom<User | null>(null);
