// Cuentas en la web con Supabase Auth (sin contraseña propia): Apple, Google o enlace mágico por email.
// Usa el cliente oficial supabase-js (cargado por el build web). La sesión da el JWT que el backend verifica.
export function createWebAuth({ supabaseUrl, publishableKey, redirectTo = (typeof location !== 'undefined' ? location.origin + location.pathname : undefined) }) {
  const sb = globalThis.supabase && globalThis.supabase.createClient(supabaseUrl, publishableKey, { auth: { persistSession: true, detectSessionInUrl: true } });
  if (!sb) throw new Error('supabase-js no cargado');
  return {
    client: sb,
    // Devuelve { pending } porque Apple/Google/email redirigen y vuelven con la sesión
    async signUp({ method = 'email', email = null } = {}) {
      if (method === 'apple' || method === 'google') { await sb.auth.signInWithOAuth({ provider: method, options: { redirectTo } }); return { pending: 'redirect' }; }
      if (!email) throw Object.assign(new Error('email_required'), { code: 'email_required' });
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
      if (error) throw Object.assign(new Error(error.message), { code: 'auth_error' });
      return { pending: 'check_email' };
    },
    signIn(opts) { return this.signUp(opts); },
    async session() {
      const { data } = await sb.auth.getSession();
      const s = data && data.session; if (!s) return null;
      return { userId: s.user.id, token: s.access_token, method: (s.user.app_metadata && s.user.app_metadata.provider) || 'email', email: s.user.email || null };
    },
    onChange(fn) { sb.auth.onAuthStateChange(() => fn()); },
    signOut: () => sb.auth.signOut(),
  };
}
