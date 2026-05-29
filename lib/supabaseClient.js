import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hkilethxdlkwxtqxgpic.supabase.co'; // Replace with your Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhraWxldGh4ZGxrd3h0cXhncGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNzIzNzIsImV4cCI6MjA1NTk0ODM3Mn0.asFGa3V6pTtW1a7Q9aLE_9-Y3dqV7FRTv-qE3iySLZA'; // Replace with your Supabase anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);