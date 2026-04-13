import { createClient } from '@supabase/supabase-js';

// Supabase 连接配置
const supabaseUrl = 'https://iunnupfiznpzadamiihn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1bm51cGZpem5wemFkYW1paG4iLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzQ5MzY1NDE5LCJleHAiOjE5NjA5NDE0MTl9.sb_secret_kealv8JTBbGRGUYeD7p0Lg_EhKjhmaf';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
