create extension if not exists "pgcrypto";

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  alter column role set default 'organization';

alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'organization'));

alter table public.organizations
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists email text,
  add column if not exists license_number text,
  add column if not exists phone text,
  add column if not exists representative_name text,
  add column if not exists representative_position text,
  add column if not exists website text,
  add column if not exists address text,
  add column if not exists status text not null default 'pending';

alter table public.organizations
  drop constraint if exists organizations_status_check;

alter table public.organizations
  add constraint organizations_status_check check (status in ('pending', 'active', 'suspended'));

create unique index if not exists idx_organizations_user_id on public.organizations(user_id) where user_id is not null;
create index if not exists idx_organizations_email on public.organizations(email);

create table if not exists public.evaluation_tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  audience text not null,
  year integer not null,
  source_file text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evaluation_tool_questions (
  id uuid primary key default gen_random_uuid(),
  evaluation_tool_id uuid not null references public.evaluation_tools(id) on delete cascade,
  standard_title text not null,
  question_number text,
  question text not null,
  max_score numeric not null default 0,
  evidence text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_evaluation_tool_questions_tool_id on public.evaluation_tool_questions(evaluation_tool_id);

alter table public.assessments
  add column if not exists evaluation_tool_id uuid references public.evaluation_tools(id) on delete set null;

alter table public.assessment_answers
  alter column question_id drop not null,
  add column if not exists tool_question_id uuid references public.evaluation_tool_questions(id) on delete restrict;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'organization');

  if requested_role not in ('admin', 'organization') then
    requested_role := 'organization';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'organization_name', new.email),
    requested_role
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_org_owner(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organizations
    where id = org_id
      and user_id = auth.uid()
  );
$$;

alter table public.evaluation_tools enable row level security;
alter table public.evaluation_tool_questions enable row level security;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles
for select using (id = auth.uid() or public.is_admin());

drop policy if exists "admin full access" on public.profiles;
create policy "admin full access" on public.profiles
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access" on public.organizations;
create policy "admin full access" on public.organizations
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "organization insert own record" on public.organizations;
create policy "organization insert own record" on public.organizations
for insert with check (user_id = auth.uid());

drop policy if exists "organization read own record" on public.organizations;
create policy "organization read own record" on public.organizations
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "organization update own record" on public.organizations;
create policy "organization update own record" on public.organizations
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "admin full access" on public.evaluation_tools;
create policy "admin full access" on public.evaluation_tools
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated read evaluation tools" on public.evaluation_tools;
create policy "authenticated read evaluation tools" on public.evaluation_tools
for select using (auth.role() = 'authenticated');

drop policy if exists "admin full access" on public.evaluation_tool_questions;
create policy "admin full access" on public.evaluation_tool_questions
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "authenticated read evaluation tool questions" on public.evaluation_tool_questions;
create policy "authenticated read evaluation tool questions" on public.evaluation_tool_questions
for select using (auth.role() = 'authenticated');

drop policy if exists "admin full access" on public.assessments;
create policy "admin full access" on public.assessments
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "organization read own assessments" on public.assessments;
create policy "organization read own assessments" on public.assessments
for select using (public.is_org_owner(organization_id) or public.is_admin());

drop policy if exists "organization insert own assessments" on public.assessments;
create policy "organization insert own assessments" on public.assessments
for insert with check (public.is_org_owner(organization_id) or public.is_admin());

drop policy if exists "admin full access" on public.assessment_answers;
create policy "admin full access" on public.assessment_answers
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "organization insert own assessment answers" on public.assessment_answers;
create policy "organization insert own assessment answers" on public.assessment_answers
for insert with check (
  exists (
    select 1
    from public.assessments a
    where a.id = assessment_id
      and public.is_org_owner(a.organization_id)
  )
);

drop policy if exists "organization read own assessment answers" on public.assessment_answers;
create policy "organization read own assessment answers" on public.assessment_answers
for select using (
  exists (
    select 1
    from public.assessments a
    where a.id = assessment_id
      and (public.is_org_owner(a.organization_id) or public.is_admin())
  )
);
