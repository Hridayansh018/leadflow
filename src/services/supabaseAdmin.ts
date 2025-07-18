import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Please define the Supabase environment variables in your .env.local file');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey); 