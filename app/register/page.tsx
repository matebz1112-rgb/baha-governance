"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/app/lib/supabase";
import { useToast } from "@/app/components/ToastProvider";

const categories = ["خيرية", "تنموية", "صحية", "تعليمية", "ثقافية", "أخرى"];

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    category: categories[0],
    city: "",
    license_number: "",
    phone: "",
    representative_name: "",
    representative_position: "",
    website: "",
    address: ""
  });

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      showToast("تمت تجربة التسجيل محليًا. اربط Supabase للحفظ الحقيقي.", "success");
      router.replace("/login");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          role: "organization",
          full_name: form.representative_name,
          organization_name: form.name
        }
      }
    });

    if (error || !data.user) {
      setLoading(false);
      showToast(error?.message ?? "تعذر إنشاء حساب الجمعية", "error");
      return;
    }

    const { error: organizationError } = await supabase.from("organizations").insert({
      user_id: data.user.id,
      email: form.email,
      name: form.name,
      category: form.category,
      city: form.city,
      license_number: form.license_number,
      phone: form.phone,
      representative_name: form.representative_name,
      representative_position: form.representative_position,
      website: form.website,
      address: form.address,
      status: "pending"
    });

    setLoading(false);

    if (organizationError) {
      showToast("تم إنشاء الحساب، لكن تعذر حفظ بيانات الجمعية. راجع سياسات قاعدة البيانات.", "error");
      return;
    }

    showToast("تم تسجيل الجمعية بنجاح. يمكنها الدخول بالبريد وكلمة المرور.", "success");
    router.replace("/login");
  }

  return (
    <main className="login-page">
      <section className="card" style={{ width: "min(920px, 100%)" }}>
        <div className="card-header">
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>تسجيل جمعية جديدة</h1>
            <p>أنشئ حسابًا للجمعية واربطه ببياناتها الكاملة.</p>
          </div>
          <div className="stat-icon"><Building2 /></div>
        </div>
        <form className="card-body form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>البريد الإلكتروني</label>
              <input className="input" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
            </div>
            <div className="field">
              <label>كلمة المرور</label>
              <input className="input" type="password" minLength={6} value={form.password} onChange={(event) => updateField("password", event.target.value)} required />
            </div>
            <div className="field">
              <label>اسم الجمعية</label>
              <input className="input" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
            </div>
            <div className="field">
              <label>نوع الجمعية</label>
              <select className="select" value={form.category} onChange={(event) => updateField("category", event.target.value)}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
            <div className="field">
              <label>المدينة</label>
              <input className="input" value={form.city} onChange={(event) => updateField("city", event.target.value)} required />
            </div>
            <div className="field">
              <label>رقم الترخيص</label>
              <input className="input" value={form.license_number} onChange={(event) => updateField("license_number", event.target.value)} />
            </div>
            <div className="field">
              <label>رقم التواصل</label>
              <input className="input" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
            </div>
            <div className="field">
              <label>ممثل الجمعية</label>
              <input className="input" value={form.representative_name} onChange={(event) => updateField("representative_name", event.target.value)} />
            </div>
            <div className="field">
              <label>صفة الممثل</label>
              <input className="input" value={form.representative_position} onChange={(event) => updateField("representative_position", event.target.value)} />
            </div>
            <div className="field">
              <label>الموقع الإلكتروني</label>
              <input className="input" value={form.website} onChange={(event) => updateField("website", event.target.value)} />
            </div>
            <div className="field">
              <label>العنوان</label>
              <input className="input" value={form.address} onChange={(event) => updateField("address", event.target.value)} />
            </div>
          </div>
          <div className="actions">
            <button className="btn" disabled={loading}>{loading ? "جاري التسجيل..." : "تسجيل الجمعية"}</button>
            <Link className="btn secondary" href="/login">العودة لتسجيل الدخول</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
