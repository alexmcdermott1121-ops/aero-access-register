create extension if not exists pgcrypto;

create table if not exists public.allowed_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.access_register (
  id uuid primary key default gen_random_uuid(),
  holder_name text not null,
  holder_type text not null check (holder_type in ('Committee', 'Building Manager', 'Strata Manager', 'Contractor', 'Consultant', 'Engineer', 'Lawyer', 'Resident', 'Other')),
  company text,
  contact_details text,
  access_type text not null check (access_type in ('Key only', 'Fob only', 'Remote only', 'Key + Fob', 'Garage remote + fob', 'Common area access', 'Contractor / temporary access', 'Inspection access', 'Digital / system access', 'Full building access - common areas, garage and services areas', 'Other')),
  access_area text not null check (access_area in ('Common areas', 'Basement / car park', 'Garage', 'Garbage / waste areas', 'Plant room', 'Roof', 'Fire services area', 'Storage / common area', 'Building management areas', 'Unit access by consent', 'Full building access - common areas, garage and services areas', 'Other')),
  purpose text not null,
  approved_by text,
  authority_source text not null check (authority_source in ('Committee approval', 'Strata instruction', 'Building manager instruction', 'Emergency access', 'Owner/occupier consent', 'Other')),
  approval_reference text,
  approval_date date,
  start_date date,
  expiry_date date,
  return_due_date date,
  returned_date date,
  status text not null default 'Pending approval' check (status in ('Pending approval', 'Approved', 'Issued', 'Active', 'Returned', 'Expired', 'Revoked', 'Archived')),
  conditions text,
  notes text,
  attachment_url text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_audit_log (
  id uuid primary key default gen_random_uuid(),
  access_record_id uuid references public.access_register(id) on delete set null,
  action text not null,
  details text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

insert into public.allowed_users (email, role)
values ('alexmcdermott1121@gmail.com', 'admin')
on conflict (email) do update set role = excluded.role;

create or replace function public.is_allowed_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.allowed_users
    where email = lower(auth.jwt() ->> 'email')
  );
$$;

create or replace function public.is_admin_allowed_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.allowed_users
    where email = lower(auth.jwt() ->> 'email')
      and role = 'admin'
  );
$$;

create or replace function public.set_access_register_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = auth.uid();
  end if;
  new.updated_by = auth.uid();
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists access_register_metadata on public.access_register;
create trigger access_register_metadata
before insert or update on public.access_register
for each row execute function public.set_access_register_metadata();

alter table public.allowed_users enable row level security;
alter table public.access_register enable row level security;
alter table public.access_audit_log enable row level security;

drop policy if exists "allowed users can read allowed users" on public.allowed_users;
create policy "allowed users can read allowed users"
on public.allowed_users
for select
to authenticated
using (public.is_allowed_user());

drop policy if exists "admins can manage allowed users" on public.allowed_users;
create policy "admins can manage allowed users"
on public.allowed_users
for all
to authenticated
using (public.is_admin_allowed_user())
with check (public.is_admin_allowed_user());

drop policy if exists "allowed users can read access register" on public.access_register;
create policy "allowed users can read access register"
on public.access_register
for select
to authenticated
using (public.is_allowed_user());

drop policy if exists "admins can create access register records" on public.access_register;
create policy "admins can create access register records"
on public.access_register
for insert
to authenticated
with check (public.is_admin_allowed_user());

drop policy if exists "admins can update access register records" on public.access_register;
create policy "admins can update access register records"
on public.access_register
for update
to authenticated
using (public.is_admin_allowed_user())
with check (public.is_admin_allowed_user());

drop policy if exists "admins can delete access register records" on public.access_register;
drop policy if exists "alex can delete access register records" on public.access_register;
create policy "alex can delete access register records"
on public.access_register
for delete
to authenticated
using (lower(auth.jwt() ->> 'email') = 'alexmcdermott1121@gmail.com');

drop policy if exists "allowed users can read audit log" on public.access_audit_log;
create policy "allowed users can read audit log"
on public.access_audit_log
for select
to authenticated
using (public.is_allowed_user());

drop policy if exists "admins can create audit log" on public.access_audit_log;
create policy "admins can create audit log"
on public.access_audit_log
for insert
to authenticated
with check (public.is_admin_allowed_user());

drop policy if exists "admins can delete audit log" on public.access_audit_log;
create policy "admins can delete audit log"
on public.access_audit_log
for delete
to authenticated
using (public.is_admin_allowed_user());

insert into public.access_register (
  holder_name,
  holder_type,
  company,
  contact_details,
  access_type,
  access_area,
  purpose,
  approved_by,
  authority_source,
  approval_reference,
  approval_date,
  start_date,
  expiry_date,
  return_due_date,
  status,
  conditions,
  notes,
  attachment_url
)
select *
from (
  values
  (
    'AERO Building Manager',
    'Building Manager',
    'AERO Apartments',
    'building.manager@example.com',
    'Key only',
    'Common areas',
    'Routine common property management',
    'AERO Committee',
    'Committee approval',
    'Committee minutes 2026-04-01',
    '2026-04-01'::date,
    '2026-04-02'::date,
    '2027-04-02'::date,
    null::date,
    'Active',
    'Access is limited to approved building management duties.',
    'Safe demo label only. No codes or key cuts stored.',
    null
  ),
  (
    'FireSafe Services',
    'Contractor',
    'FireSafe Services Pty Ltd',
    'firesafe@example.com',
    'Contractor / temporary access',
    'Fire services area',
    'Scheduled fire services inspection',
    'Strata Manager',
    'Strata instruction',
    'Work order FS-2026-051',
    '2026-05-01'::date,
    '2026-05-06'::date,
    '2026-06-04'::date,
    '2026-06-05'::date,
    'Issued',
    'Access during business hours with sign-in required.',
    'Contractor access set 01. No sensitive access details recorded.',
    null
  )
) as seed (
  holder_name,
  holder_type,
  company,
  contact_details,
  access_type,
  access_area,
  purpose,
  approved_by,
  authority_source,
  approval_reference,
  approval_date,
  start_date,
  expiry_date,
  return_due_date,
  status,
  conditions,
  notes,
  attachment_url
)
where not exists (
  select 1
  from public.access_register existing
  where existing.holder_name = seed.holder_name
    and existing.purpose = seed.purpose
);
