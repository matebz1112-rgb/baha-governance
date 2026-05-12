# نظام الحوكمة الذكي

لوحة حوكمة عربية RTL مبنية باستخدام Next.js وTypeScript وSupabase وVercel.

## التشغيل المحلي

1. أنشئ ملف `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

2. ثبت الحزم وشغل المشروع:

```bash
npm install
npm run dev
```

3. نفذ SQL الموجود في `supabase/schema.sql` داخل Supabase SQL Editor.

## الصلاحيات

النظام يحمي الصفحات عبر Supabase Auth ويتحقق من جدول `profiles` بأن دور المستخدم `admin`.
عند إنشاء مستخدم جديد يتم إنشاء ملفه تلقائيًا كمدير عبر trigger مرفق في SQL.

## المرفقات

يستخدم النظام bucket باسم `governance-attachments` داخل Supabase Storage، ويدعم PDF وWord وExcel والصور.
