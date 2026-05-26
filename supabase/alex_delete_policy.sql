drop policy if exists "admins can delete access register records" on public.access_register;

drop policy if exists "alex can delete access register records" on public.access_register;

create policy "alex can delete access register records"
on public.access_register
for delete
to authenticated
using (lower(auth.jwt() ->> 'email') = 'alexmcdermott1121@gmail.com');
