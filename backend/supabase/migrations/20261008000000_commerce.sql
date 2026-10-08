-- =====================================================================
-- Comercio de «Del barrio al negocio»: cuentas, catálogo, órdenes, pagos, entitlements, reembolsos,
-- disputas, promo, telemetría, configuración remota, admin. PostgreSQL (Supabase).
-- Reglas:
--   * Dinero real en unidades mínimas (bigint) + moneda. Nunca float.
--   * Idempotencia con restricciones UNIQUE (eventos, pagos, concesiones, reembolsos).
--   * RLS: el usuario solo LEE lo suyo. Nadie salvo el backend (propietario / service_role) escribe en comercio.
--   * Borrar cuenta borra datos personales; la contabilidad se conserva anonimizada (user_id NULL + user_ref_hash).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Identidad (datos personales mínimos) ----------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 40),
  country text check (char_length(country) between 2 and 3),   -- ISO alfa-2 (Stripe) o alfa-3 (tiendas de Apple)
  is_minor boolean not null default false,
  is_tester boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('web', 'pwa', 'ios', 'android')),
  app_version text,
  last_seen timestamptz not null default now()
);
create table if not exists public.commerce_accounts (
  user_id uuid primary key,
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);
create table if not exists public.admin_users (
  user_id uuid primary key,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- Catálogo ----------
create table if not exists public.catalog_versions (
  version int primary key,
  published_at timestamptz not null default now(),
  notes text
);
create table if not exists public.products (
  id text primary key,                                   -- SKU lógico (nunca cambia de significado)
  type text not null check (type in ('COSMETIC_PACK','SPORT_EXPANSION','SYSTEM_EXPANSION','PRESTIGE_CAREER','BUNDLE','REMOVE_ADS','SAVE_SLOTS','SUPPORTER_PACK','FUTURE_SUBSCRIPTION','PROMO')),
  status text not null check (status in ('draft','testing','coming_soon','active','retired')),
  name text not null,
  entitlements text[] not null default '{}',
  requires jsonb,
  bundle_contents text[],
  one_time boolean not null default true,
  catalog_version int not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.product_prices (
  product_id text not null references public.products (id),
  currency char(3) not null,
  amount_minor bigint not null check (amount_minor > 0),
  primary key (product_id, currency)
);
create table if not exists public.product_provider_ids (
  product_id text not null references public.products (id),
  provider text not null check (provider in ('stripe','apple','google')),
  environment text not null check (environment in ('development','staging','production')),
  provider_product_id text,
  provider_price_id text,
  primary key (product_id, provider, environment),
  unique (provider, environment, provider_product_id)
);

-- ---------- Órdenes y pagos ----------
create table if not exists public.orders (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete set null,
  user_ref_hash text,
  sku text not null references public.products (id),
  provider text not null check (provider in ('stripe','apple','google','mock')),
  status text not null check (status in ('CREATED','PENDING','PAID','FULFILLED','FAILED','CANCELLED','REFUNDED','PARTIALLY_REFUNDED','DISPUTED','REVOKED')),
  amount_minor bigint not null check (amount_minor >= 0),
  currency char(3) not null,
  environment text not null,
  catalog_version int not null,
  platform text,
  provider_checkout_id text unique,
  provider_payment_id text,
  checkout_url text,
  expires_at timestamptz,
  country text check (char_length(country) between 2 and 3),   -- ISO alfa-2 (Stripe) o alfa-3 (tiendas de Apple)
  withdrawal_consent_at timestamptz,
  failure_reason text,
  fulfillment_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  fulfilled_at timestamptz,
  refunded_at timestamptz,
  unique (provider, provider_payment_id)
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text not null references public.products (id),
  quantity int not null default 1 check (quantity = 1),
  amount_minor bigint not null check (amount_minor >= 0)
);
create table if not exists public.payments (
  id uuid primary key,
  order_id uuid not null references public.orders (id),
  user_id uuid references auth.users (id) on delete set null,
  user_ref_hash text,
  provider text not null,
  provider_payment_id text not null,
  gross_minor bigint, tax_minor bigint, provider_fee_minor bigint, platform_fee_minor bigint, net_minor bigint,
  currency char(3) not null,
  country text check (char_length(country) between 2 and 3),   -- ISO alfa-2 (Stripe) o alfa-3 (tiendas de Apple)
  created_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);
-- Todos los webhooks/notificaciones recibidos (idempotencia + auditoría)
create table if not exists public.provider_events (
  provider text not null,
  event_id text not null,
  type text not null,
  payload jsonb not null,
  status text not null default 'received' check (status in ('received','processed','error')),
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  primary key (provider, event_id)
);
create index if not exists provider_events_status_idx on public.provider_events (status);

-- ---------- Entitlements ----------
create table if not exists public.entitlement_grants (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete set null,
  user_ref_hash text,
  entitlement_id text not null,
  source text not null check (source in ('stripe','apple','google','promo','admin','legacy','mock')),
  source_purchase_id text not null,
  order_id uuid references public.orders (id),
  product_id text,
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoke_reason text,
  revoke_ref text,
  unique (order_id, entitlement_id),
  unique (source, source_purchase_id, entitlement_id)
);
create index if not exists grants_user_idx on public.entitlement_grants (user_id);
-- Estado actual (derivado por trigger): activo si alguna concesión está activa
create table if not exists public.entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  entitlement_id text not null,
  status text not null check (status in ('active','inactive')),
  updated_at timestamptz not null default now(),
  primary key (user_id, entitlement_id)
);

-- ---------- Reembolsos, disputas, auditoría, recibos ----------
create table if not exists public.refunds (
  id uuid primary key,
  order_id uuid references public.orders (id),
  provider text not null,
  provider_refund_id text not null,
  provider_payment_id text,
  amount_minor bigint not null check (amount_minor >= 0),
  currency char(3),
  "full" boolean not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (provider, provider_refund_id)
);
create index if not exists refunds_pi_idx on public.refunds (provider_payment_id) where order_id is null;
create table if not exists public.disputes (
  id uuid primary key,
  order_id uuid references public.orders (id),
  provider text not null,
  provider_dispute_id text not null,
  status text, reason text, amount_minor bigint,
  updated_at timestamptz not null default now(),
  unique (provider, provider_dispute_id)
);
create table if not exists public.purchase_events (
  id uuid primary key,
  order_id uuid references public.orders (id),
  user_id uuid,
  type text not null,
  data jsonb,
  at timestamptz not null default now()
);
create table if not exists public.iap_receipts (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete set null,
  provider text not null check (provider in ('apple','google')),
  transaction_id text not null,
  original_transaction_id text,
  product_id text,
  environment text,
  storefront text,
  verified_at timestamptz not null default now(),
  unique (provider, transaction_id)
);
create table if not exists public.subscriptions (      -- preparado; sin uso todavía
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  provider text not null, provider_subscription_id text unique, status text, current_period_end timestamptz
);
create table if not exists public.ad_rewards (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete cascade,
  placement text not null,
  at timestamptz not null default now()
);

-- ---------- Promo, experimentos, configuración, telemetría, límites, admin, partidas ----------
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  sku text references public.products (id),
  entitlements text[],
  max_redemptions int,
  redemptions int not null default 0,
  starts_at timestamptz, expires_at timestamptz,
  active boolean not null default true,
  campaign text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create table if not exists public.promo_redemptions (
  promo_id uuid not null references public.promo_codes (id),
  user_id uuid not null,
  at timestamptz not null default now(),
  primary key (promo_id, user_id)
);
create table if not exists public.experiments (id text primary key, variants jsonb not null, active boolean not null default false);
create table if not exists public.experiment_assignments (
  experiment_id text not null references public.experiments (id), user_id uuid not null, variant text not null, primary key (experiment_id, user_id));
create table if not exists public.remote_config (
  environment text not null, key text not null, value jsonb not null, updated_at timestamptz not null default now(), primary key (environment, key));
create table if not exists public.analytics_events (
  id uuid primary key, user_id uuid references auth.users (id) on delete cascade, name text not null, props jsonb, at timestamptz not null default now());
create table if not exists public.rate_limits (key text not null, window_start bigint not null, count int not null default 0, primary key (key, window_start));
create table if not exists public.admin_actions (
  id uuid primary key, admin_id uuid not null, action text not null, target_user_id uuid, data jsonb, at timestamptz not null default now());
create table if not exists public.game_saves (
  user_id uuid not null references auth.users (id) on delete cascade, slot int not null check (slot between 0 and 9), data jsonb not null,
  updated_at timestamptz not null default now(), primary key (user_id, slot));

-- ---------- Triggers ----------
-- Recalcula el entitlement del usuario cuando cambia una concesión
create or replace function public.refresh_entitlement() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is null then return new; end if;
  insert into public.entitlements (user_id, entitlement_id, status, updated_at)
  values (new.user_id, new.entitlement_id,
          case when exists (select 1 from public.entitlement_grants g where g.user_id = new.user_id and g.entitlement_id = new.entitlement_id and g.status = 'active') then 'active' else 'inactive' end,
          now())
  on conflict (user_id, entitlement_id) do update set status = excluded.status, updated_at = now();
  return new;
end $$;
drop trigger if exists grants_refresh on public.entitlement_grants;
create trigger grants_refresh after insert or update on public.entitlement_grants for each row execute function public.refresh_entitlement();
-- Una concesión revocada no se reactiva (el historial no se reescribe)
create or replace function public.grants_guard() returns trigger language plpgsql as $$
begin
  if old.status = 'revoked' and new.status <> 'revoked' then raise exception 'grant revocado: inmutable'; end if;
  return new;
end $$;
drop trigger if exists grants_guard on public.entitlement_grants;
create trigger grants_guard before update on public.entitlement_grants for each row execute function public.grants_guard();
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

-- ---------- RLS ----------
do $$ declare t text; begin
  foreach t in array array['profiles','devices','commerce_accounts','admin_users','catalog_versions','products','product_prices','product_provider_ids','orders','order_items','payments',
    'provider_events','entitlement_grants','entitlements','refunds','disputes','purchase_events','iap_receipts','subscriptions','ad_rewards','promo_codes','promo_redemptions',
    'experiments','experiment_assignments','remote_config','analytics_events','rate_limits','admin_actions','game_saves'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    -- Defensa en profundidad: los clientes (anon/authenticated) no escriben en comercio
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
  end loop;
end $$;
-- El backend (propietario de las tablas / service_role) sí escribe: FORCE RLS no aplica a roles con BYPASSRLS
-- y el propietario necesita una política explícita al forzar RLS:
do $$ declare t text; begin
  foreach t in array array['profiles','devices','commerce_accounts','admin_users','catalog_versions','products','product_prices','product_provider_ids','orders','order_items','payments',
    'provider_events','entitlement_grants','entitlements','refunds','disputes','purchase_events','iap_receipts','subscriptions','ad_rewards','promo_codes','promo_redemptions',
    'experiments','experiment_assignments','remote_config','analytics_events','rate_limits','admin_actions','game_saves'] loop
    execute format('drop policy if exists backend_all on public.%I', t);
    execute format('create policy backend_all on public.%I for all to current_user using (true) with check (true)', t);
  end loop;
end $$;

-- Lectura propia
create policy own_profile_read on public.profiles for select to authenticated using (user_id = auth.uid());
create policy own_orders_read on public.orders for select to authenticated using (user_id = auth.uid());
create policy own_items_read on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy own_payments_read on public.payments for select to authenticated using (user_id = auth.uid());
create policy own_grants_read on public.entitlement_grants for select to authenticated using (user_id = auth.uid());
create policy own_entitlements_read on public.entitlements for select to authenticated using (user_id = auth.uid());
create policy own_refunds_read on public.refunds for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy own_receipts_read on public.iap_receipts for select to authenticated using (user_id = auth.uid());
create policy own_adrewards_read on public.ad_rewards for select to authenticated using (user_id = auth.uid());
create policy own_devices_read on public.devices for select to authenticated using (user_id = auth.uid());
-- Catálogo público (sin borradores) y configuración remota (no secreta)
create policy catalog_read on public.products for select to anon, authenticated using (status not in ('draft','retired'));
create policy prices_read on public.product_prices for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and p.status not in ('draft','retired')));
create policy config_read on public.remote_config for select to anon, authenticated using (true);
-- Partidas en la nube: del usuario (no son fuente de verdad de compras)
grant insert, update, delete on public.game_saves to authenticated;
create policy own_saves_all on public.game_saves for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- El usuario puede cambiar su nombre visible y país (no is_tester ni is_minor)
grant update (display_name, country) on public.profiles to authenticated;
create policy own_profile_update on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Borrado de cuenta: PII fuera, contabilidad anonimizada ----------
create or replace function public.delete_account(p_user uuid, p_ref text) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.orders set user_id = null, user_ref_hash = p_ref where user_id = p_user;
  update public.payments set user_id = null, user_ref_hash = p_ref where user_id = p_user;
  update public.entitlement_grants set user_id = null, user_ref_hash = p_ref where user_id = p_user;
  delete from public.entitlements where user_id = p_user;
  delete from public.analytics_events where user_id = p_user;
  delete from public.devices where user_id = p_user;
  delete from public.game_saves where user_id = p_user;
  delete from public.commerce_accounts where user_id = p_user;
  delete from public.profiles where user_id = p_user;
  -- auth.users lo borra la Edge Function con la API de administración de Supabase Auth
end $$;
revoke execute on function public.delete_account(uuid, text) from public, anon, authenticated;
