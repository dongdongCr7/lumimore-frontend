import { createClient } from '@supabase/supabase-js';

// 使用环境变量或你的 Supabase 项目
const supabaseUrl = 'https://iunnupfiznpzadamiihn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1bm51cGZpem5wemFkYW1paWhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAyMzgxNCwiZXhwIjoyMDkxNTk5ODE0fQ.ExNLD5DD5bYU2XrR69nqxzQ60vaiBMWEFvKGXILPwhU';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
