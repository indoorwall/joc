-- Cuentas: perfil completo (edad, términos, control parental, publicidad) y carreras en la nube.
-- La lógica y la validación viven en commerce/core/accounts.js (Edge Function `profile` y `game-saves`).

alter table public.profiles
  add column if not exists age_band text check (age_band in ('u13', '13_17', '18p')),
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists terms_version text check (char_length(terms_version) <= 20),
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists parental_status text not null default 'none' check (parental_status in ('none', 'pending', 'approved', 'rejected')),
  add column if not exists parent_email text check (char_length(parent_email) <= 120),
  add column if not exists parental_requested_at timestamptz,
  add column if not exists parental_decided_at timestamptz;

-- A un menor nunca se le apunta a publicidad (también si alguien escribe directamente en la tabla)
alter table public.profiles drop constraint if exists profiles_minor_no_marketing;
alter table public.profiles add constraint profiles_minor_no_marketing check (not (is_minor and marketing_opt_in));

-- El perfil ya no se edita directamente desde el cliente: pasa por la Edge Function `profile`, que valida país, nombre
-- y edad (la edad solo se fija una vez). Así nadie se cambia la edad para saltarse los límites de compra.
drop policy if exists own_profile_update on public.profiles;
revoke update on public.profiles from authenticated;

-- Carreras en la nube: el jugador puede leer las suyas (RLS); escribir solo vía la Edge Function `game-saves`
drop policy if exists own_saves_read on public.game_saves;
create policy own_saves_read on public.game_saves for select to authenticated using (user_id = auth.uid());
alter table public.game_saves drop constraint if exists game_saves_size;
alter table public.game_saves add constraint game_saves_size check (pg_column_size(data) <= 512 * 1024);
