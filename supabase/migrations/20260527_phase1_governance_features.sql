alter table public.access_register
  add column if not exists approval_reference text;

update public.access_register
set status = case status
  when 'Expiring soon' then 'Issued'
  when 'Overdue return' then 'Expired'
  when 'Lost' then 'Revoked'
  else status
end
where status in ('Expiring soon', 'Overdue return', 'Lost');

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'access_register'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.access_register drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.access_register
  add constraint access_register_status_check
  check (status in (
    'Pending approval',
    'Approved',
    'Issued',
    'Active',
    'Returned',
    'Expired',
    'Revoked',
    'Archived'
  ));
