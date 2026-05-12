-- 1) أنشئ المستخدم من Supabase > Authentication > Users
-- 2) غيّر البريد أدناه إلى بريد المدير
-- 3) شغّل هذا الملف في SQL Editor

update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'matebz.1112@gmail.com'
  limit 1
);

select id, full_name, role
from public.profiles
where role = 'admin';
