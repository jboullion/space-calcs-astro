import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    'https://rhydmeirsmgumqfohcwe.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoeWRtZWlyc21ndW1xZm9oY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTMxNjg0NjEsImV4cCI6MjAwODc0NDQ2MX0.-w9Tl_zo87XT8OgTq1bCC13iX9mDEyGLRx7toCw2PaY',
);