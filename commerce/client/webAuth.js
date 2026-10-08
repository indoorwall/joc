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
    // Código de 6 cifras por email (Supabase OTP). signup crea la cuenta; signin solo entra si ya existe.
    async requestCode({ email, intent = 'signup' }) {
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: intent === 'signup', emailRedirectTo: redirectTo } });
      if (error) throw Object.assign(new Error(error.message), { code: /signups? not allowed|not found/i.test(error.message) ? 'account_not_found' : /rate/i.test(error.message) ? 'rate_limited' : 'auth_error' });
      return { sent: true };
    },
    async verifyCode({ email, code }) {
      const { data, error } = await sb.auth.verifyOtp({ email, token: String(code || ''), type: 'email' });
      if (error || !data || !data.session) throw Object.assign(new Error(error ? error.message : 'invalid_code'), { code: /expired/i.test((error && error.message) || '') ? 'code_expired' : 'invalid_code' });
      const s = data.session;
      return { userId: s.user.id, token: s.access_token, method: 'email', email: s.user.email || email, isNew: !!(s.user.created_at && Date.now() - Date.parse(s.user.created_at) < 120000) };
    },
    async session() {
      const { data } = await sb.auth.getSession();
      const s = data && data.session; if (!s) return null;
      return { userId: s.user.id, token: s.access_token, method: (s.user.app_metadata && s.user.app_metadata.provider) || 'email', email: s.user.email || null };
    },
    onChange(fn) { sb.auth.onAuthStateChange(() => fn()); },
    signOut: () => sb.auth.signOut(),
  };
}
