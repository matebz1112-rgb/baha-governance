# خطوات تشغيل النظام على Supabase و Vercel

## 1. تحديث قاعدة البيانات

إذا كنت شغلت `supabase/schema.sql` سابقًا، شغّل الآن:

```text
supabase/upgrade-auth-evaluation-tools.sql
```

إذا كانت قاعدة البيانات جديدة تمامًا، يكفي تشغيل:

```text
supabase/schema.sql
```

## 2. إنشاء مستخدم مدير

1. افتح Supabase.
2. اذهب إلى Authentication ثم Users.
3. أنشئ مستخدمًا ببريد المدير وكلمة مرور.
4. افتح:

```text
supabase/make-admin.sql
```

5. غيّر `admin@example.com` إلى بريد المدير.
6. شغّل الملف في SQL Editor.

## 3. تسجيل جمعية

افتح صفحة:

```text
/register
```

الجمعية تسجل بالبريد وكلمة المرور وبياناتها الكاملة. بعدها تستطيع الدخول من:

```text
/login
```

## 4. مزامنة أدوات التقييم

ادخل بحساب المدير، ثم افتح:

```text
/evaluation-tools
```

واضغط "مزامنة مع قاعدة البيانات" لكل أداة تقييم.

## 5. نشر Vercel

1. ارفع المشروع إلى GitHub.
2. افتح Vercel.
3. اختر Add New Project.
4. اختر مستودع المشروع.
5. أضف متغيرات البيئة:

```env
NEXT_PUBLIC_SUPABASE_URL=رابط Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=مفتاح anon public
```

6. اضغط Deploy.

## 6. أوامر التحقق

```bash
npm install
npm run build
npm run dev
```
