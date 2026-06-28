-- Execute no SQL Editor do Supabase após criar o projeto.
-- Bucket privado para documentos patrimoniais.

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do update set public = false;

create policy "Gestores autenticados podem ler documentos"
on storage.objects for select
to authenticated
using (bucket_id = 'documentos');

create policy "Gestores autenticados podem enviar documentos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'documentos');

create policy "Gestores autenticados podem atualizar documentos"
on storage.objects for update
to authenticated
using (bucket_id = 'documentos')
with check (bucket_id = 'documentos');
