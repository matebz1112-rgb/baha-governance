create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'organization' check (role in ('admin', 'organization')),
  created_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  name text not null,
  category text not null,
  city text not null,
  license_number text,
  phone text,
  representative_name text,
  representative_position text,
  website text,
  address text,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.standards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  weight numeric not null default 10 check (weight > 0 and weight <= 100),
  created_at timestamptz not null default now()
);

create table if not exists public.organization_standards (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  standard_id uuid not null references public.standards(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (organization_id, standard_id)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  standard_id uuid not null references public.standards(id) on delete cascade,
  question text not null,
  max_score numeric not null default 5 check (max_score > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  evaluation_tool_id uuid references public.evaluation_tools(id) on delete set null,
  total_score numeric not null default 0,
  max_score numeric not null default 0,
  percentage numeric not null default 0,
  status text not null default 'completed' check (status in ('draft', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  question_id uuid references public.questions(id) on delete restrict,
  tool_question_id uuid references public.evaluation_tool_questions(id) on delete restrict,
  score numeric not null default 0 check (score >= 0),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_organizations_name on public.organizations using gin (to_tsvector('simple', name));
create unique index if not exists idx_organizations_user_id on public.organizations(user_id) where user_id is not null;
create index if not exists idx_organizations_email on public.organizations(email);
create index if not exists idx_evaluation_tool_questions_tool_id on public.evaluation_tool_questions(evaluation_tool_id);
create index if not exists idx_questions_standard_id on public.questions(standard_id);
create index if not exists idx_assessments_organization_id on public.assessments(organization_id);
create index if not exists idx_attachments_organization_id on public.attachments(organization_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'organization_name', new.email),
    case
      when new.raw_user_meta_data->>'role' = 'admin' then 'admin'
      else 'organization'
    end
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

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.standards enable row level security;
alter table public.organization_standards enable row level security;
alter table public.evaluation_tools enable row level security;
alter table public.evaluation_tool_questions enable row level security;
alter table public.questions enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.attachments enable row level security;

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

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'organizations',
    'standards',
    'organization_standards',
    'evaluation_tools',
    'evaluation_tool_questions',
    'questions',
    'assessments',
    'assessment_answers',
    'attachments'
  ]
  loop
    execute format('drop policy if exists "admin full access" on public.%I', table_name);
    execute format(
      'create policy "admin full access" on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      table_name
    );
  end loop;
end $$;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles
for select using (id = auth.uid() or public.is_admin());

drop policy if exists "organization insert own record" on public.organizations;
create policy "organization insert own record" on public.organizations
for insert with check (user_id = auth.uid());

drop policy if exists "organization read own record" on public.organizations;
create policy "organization read own record" on public.organizations
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "organization update own record" on public.organizations;
create policy "organization update own record" on public.organizations
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "authenticated read evaluation tools" on public.evaluation_tools;
create policy "authenticated read evaluation tools" on public.evaluation_tools
for select using (auth.role() = 'authenticated');

drop policy if exists "authenticated read evaluation tool questions" on public.evaluation_tool_questions;
create policy "authenticated read evaluation tool questions" on public.evaluation_tool_questions
for select using (auth.role() = 'authenticated');

drop policy if exists "organization read own assessments" on public.assessments;
create policy "organization read own assessments" on public.assessments
for select using (public.is_org_owner(organization_id) or public.is_admin());

drop policy if exists "organization insert own assessments" on public.assessments;
create policy "organization insert own assessments" on public.assessments
for insert with check (public.is_org_owner(organization_id) or public.is_admin());

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'governance-attachments',
  'governance-attachments',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin storage access" on storage.objects;
create policy "admin storage access"
on storage.objects for all
using (bucket_id = 'governance-attachments' and public.is_admin())
with check (bucket_id = 'governance-attachments' and public.is_admin());
