import { createClient } from '@supabase/supabase-js'

function makeAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE env vars');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Lazy singleton — only created on first request, not at module evaluation time
let _admin: ReturnType<typeof makeAdmin> | null = null;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof makeAdmin>, {
  get(_target, prop) {
    if (!_admin) _admin = makeAdmin();
    return (_admin as any)[prop];
  },
});
