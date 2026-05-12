"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, ShieldCheck } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/app/lib/supabase";
import { useToast } from "@/app/components/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      openPreview();
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      showToast("تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور أو أنشئ المستخدم في Supabase Auth.", "error");
      return;
    }

    showToast("تم تسجيل الدخول بنجاح", "success");
    router.replace("/");
  }

  function openPreview() {
    window.sessionStorage.setItem("governance_preview", "true");
    showToast("تم فتح وضع المعاينة المحلي", "success");
    router.replace("/");
  }

  return (
    <main className="login-page">
      <section className="card login-card">
        <div className="card-header">
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>نظام الحوكمة الذكي</h1>
            <p>دخول المدير أو الجمعية إلى لوحة التحكم</p>
          </div>
          <div className="stat-icon"><ShieldCheck /></div>
        </div>
        <form className="card-body form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input id="email" className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">كلمة المرور</label>
            <input id="password" className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          <button className="btn" type="submit" disabled={loading}>{loading ? "جاري الدخول..." : "تسجيل الدخول"}</button>
          <Link className="btn secondary" href="/register">تسجيل جمعية جديدة</Link>
          <button className="btn secondary" type="button" onClick={openPreview}>
            <Eye size={17} />
            دخول للمعاينة فقط
          </button>
          <p className="muted">المدير يدخل بحساب admin، والجمعية تدخل بالبريد الذي سجلت به بياناتها.</p>
        </form>
      </section>
    </main>
  );
}
