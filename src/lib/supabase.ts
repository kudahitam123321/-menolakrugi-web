import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pogjfldmmzcphjwgzofb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZ2pmbGRtbXpjcGhqd2d6b2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNjA2ODEsImV4cCI6MjA5MjczNjY4MX0.8opBU7Iln7V7gpAgbEG-k2EQCIA7O4z7NFbFzXRwctY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
