begin;

alter table public.access_audit_log
  drop constraint if exists access_audit_log_access_record_id_fkey;

alter table public.access_audit_log
  alter column access_record_id drop not null;

alter table public.access_audit_log
  add constraint access_audit_log_access_record_id_fkey
  foreign key (access_record_id)
  references public.access_register(id)
  on delete set null;

alter table public.access_register
  drop constraint if exists access_register_access_type_check;

alter table public.access_register
  drop constraint if exists access_register_access_area_check;

update public.access_register
set access_type = case access_type
  when 'Key' then 'Key only'
  when 'Fob' then 'Fob only'
  when 'Remote' then 'Remote only'
  when 'Contractor Access' then 'Contractor / temporary access'
  when 'Inspection Access' then 'Inspection access'
  when 'Digital Access' then 'Digital / system access'
  else access_type
end
where access_type in (
  'Key',
  'Fob',
  'Remote',
  'Contractor Access',
  'Inspection Access',
  'Digital Access'
);

update public.access_register
set access_area = case access_area
  when 'Basement' then 'Basement / car park'
  when 'Storage/common area' then 'Storage / common area'
  else access_area
end
where access_area in (
  'Basement',
  'Storage/common area'
);

alter table public.access_register
  add constraint access_register_access_type_check
  check (access_type in (
    'Key only',
    'Fob only',
    'Remote only',
    'Key + Fob',
    'Garage remote + fob',
    'Common area access',
    'Contractor / temporary access',
    'Inspection access',
    'Digital / system access',
    'Full building access - common areas, garage and services areas',
    'Other'
  ));

alter table public.access_register
  add constraint access_register_access_area_check
  check (access_area in (
    'Common areas',
    'Basement / car park',
    'Garage',
    'Garbage / waste areas',
    'Plant room',
    'Roof',
    'Fire services area',
    'Storage / common area',
    'Building management areas',
    'Unit access by consent',
    'Full building access - common areas, garage and services areas',
    'Other'
  ));

commit;
