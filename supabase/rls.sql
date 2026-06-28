-- Execute no SQL Editor do Supabase após o deploy inicial.
-- RLS para acesso via APIs do Supabase. Server Actions usam validação própria no backend.

alter table public.administracoes enable row level security;
alter table public.casas_oracao enable row level security;
alter table public.usuarios enable row level security;
alter table public.audit_log enable row level security;
alter table public.controle_mensal enable row level security;
alter table public.form_148_status enable row level security;
alter table public.documentos enable row level security;
alter table public.movimentos enable row level security;
alter table public.bens_patrimoniais enable row level security;

drop policy if exists "gestor_adm_select_administracoes" on public.administracoes;
drop policy if exists "gestor_adm_insert_administracoes" on public.administracoes;
drop policy if exists "gestor_adm_update_administracoes" on public.administracoes;
drop policy if exists "gestor_adm_select_casas_oracao" on public.casas_oracao;
drop policy if exists "gestor_adm_insert_casas_oracao" on public.casas_oracao;
drop policy if exists "gestor_adm_update_casas_oracao" on public.casas_oracao;
drop policy if exists "usuario_select_proprio_perfil" on public.usuarios;
drop policy if exists "usuario_insert_proprio_perfil" on public.usuarios;
drop policy if exists "usuario_update_proprio_perfil" on public.usuarios;
drop policy if exists "gestor_adm_select_audit_log" on public.audit_log;
drop policy if exists "gestor_adm_select_controle_mensal" on public.controle_mensal;
drop policy if exists "gestor_adm_insert_controle_mensal" on public.controle_mensal;
drop policy if exists "gestor_adm_update_controle_mensal" on public.controle_mensal;
drop policy if exists "gestor_adm_select_form_148_status" on public.form_148_status;
drop policy if exists "gestor_adm_insert_form_148_status" on public.form_148_status;
drop policy if exists "gestor_adm_update_form_148_status" on public.form_148_status;
drop policy if exists "gestor_adm_select_documentos" on public.documentos;
drop policy if exists "gestor_adm_insert_documentos" on public.documentos;
drop policy if exists "gestor_adm_update_documentos" on public.documentos;
drop policy if exists "gestor_adm_select_movimentos" on public.movimentos;
drop policy if exists "gestor_adm_insert_movimentos" on public.movimentos;
drop policy if exists "gestor_adm_update_movimentos" on public.movimentos;
drop policy if exists "gestor_adm_select_bens_patrimoniais" on public.bens_patrimoniais;
drop policy if exists "gestor_adm_insert_bens_patrimoniais" on public.bens_patrimoniais;
drop policy if exists "gestor_adm_update_bens_patrimoniais" on public.bens_patrimoniais;

create policy "gestor_adm_select_administracoes"
on public.administracoes for select
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = administracoes.id
  )
);

create policy "gestor_adm_insert_administracoes"
on public.administracoes for insert
to authenticated
with check (false);

create policy "gestor_adm_update_administracoes"
on public.administracoes for update
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = administracoes.id
  )
)
with check (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = administracoes.id
  )
);

create policy "gestor_adm_select_casas_oracao"
on public.casas_oracao for select
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = casas_oracao."administracaoId"
  )
);

create policy "gestor_adm_insert_casas_oracao"
on public.casas_oracao for insert
to authenticated
with check (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = casas_oracao."administracaoId"
  )
);

create policy "gestor_adm_update_casas_oracao"
on public.casas_oracao for update
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = casas_oracao."administracaoId"
  )
)
with check (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = casas_oracao."administracaoId"
  )
);

create policy "usuario_select_proprio_perfil"
on public.usuarios for select
to authenticated
using ("authUserId" = auth.uid());

create policy "usuario_insert_proprio_perfil"
on public.usuarios for insert
to authenticated
with check ("authUserId" = auth.uid());

create policy "usuario_update_proprio_perfil"
on public.usuarios for update
to authenticated
using ("authUserId" = auth.uid())
with check ("authUserId" = auth.uid());

create policy "gestor_adm_select_audit_log"
on public.audit_log for select
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = audit_log."administracaoId"
  )
);

create policy "gestor_adm_select_controle_mensal"
on public.controle_mensal for select
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = controle_mensal."administracaoId"
  )
);

create policy "gestor_adm_insert_controle_mensal"
on public.controle_mensal for insert
to authenticated
with check (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = controle_mensal."administracaoId"
  )
);

create policy "gestor_adm_update_controle_mensal"
on public.controle_mensal for update
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = controle_mensal."administracaoId"
  )
)
with check (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = controle_mensal."administracaoId"
  )
);

create policy "gestor_adm_select_form_148_status"
on public.form_148_status for select
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = form_148_status."administracaoId"
  )
);

create policy "gestor_adm_insert_form_148_status"
on public.form_148_status for insert
to authenticated
with check (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = form_148_status."administracaoId"
  )
);

create policy "gestor_adm_update_form_148_status"
on public.form_148_status for update
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = form_148_status."administracaoId"
  )
)
with check (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = form_148_status."administracaoId"
  )
);

create policy "gestor_adm_select_documentos"
on public.documentos for select
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = documentos."administracaoId"
  )
);

create policy "gestor_adm_insert_documentos"
on public.documentos for insert
to authenticated
with check (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = documentos."administracaoId"
  )
);

create policy "gestor_adm_update_documentos"
on public.documentos for update
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = documentos."administracaoId"
  )
)
with check (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = documentos."administracaoId"
  )
);

create policy "gestor_adm_select_movimentos"
on public.movimentos for select
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = movimentos."administracaoId"
  )
);

create policy "gestor_adm_insert_movimentos"
on public.movimentos for insert
to authenticated
with check (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = movimentos."administracaoId"
  )
);

create policy "gestor_adm_update_movimentos"
on public.movimentos for update
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = movimentos."administracaoId"
  )
)
with check (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = movimentos."administracaoId"
  )
);

create policy "gestor_adm_select_bens_patrimoniais"
on public.bens_patrimoniais for select
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = bens_patrimoniais."administracaoId"
  )
);

create policy "gestor_adm_insert_bens_patrimoniais"
on public.bens_patrimoniais for insert
to authenticated
with check (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = bens_patrimoniais."administracaoId"
  )
);

create policy "gestor_adm_update_bens_patrimoniais"
on public.bens_patrimoniais for update
to authenticated
using (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = bens_patrimoniais."administracaoId"
  )
)
with check (
  exists (
    select 1 from public.usuarios u
    where u."authUserId" = auth.uid()
      and u.ativo = true
      and u.papel = 'gestor_adm'
      and u."administracaoId" = bens_patrimoniais."administracaoId"
  )
);
