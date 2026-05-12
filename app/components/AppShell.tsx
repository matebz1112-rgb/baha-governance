"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileArchive,
  FileText,
  HelpCircle,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/app/lib/supabase";

const navItems = [
  { href: "/", label: "لوحة التحكم", icon: BarChart3 },
  { href: "/organizations", label: "الجمعيات", icon: Building2 },
  { href: "/standards", label: "المعايير", icon: ShieldCheck },
  { href: "/questions", label: "الأسئلة", icon: HelpCircle },
  { href: "/evaluation-tools", label: "أدوات التقييم", icon: ClipboardList },
  { href: "/assessments", label: "التقييم", icon: ClipboardCheck },
  { href: "/attachments", label: "المرفقات", icon: FileArchive },
  { href: "/reports", label: "التقارير", icon: FileText }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const title = useMemo(() => navItems.find((item) => item.href === pathname)?.label ?? "نظام الحوكمة الذكي", [pathname]);

  useEffect(() => {
    async function checkSession() {
      const previewMode = window.sessionStorage.getItem("governance_preview") === "true";
      if (!isSupabaseConfigured || previewMode) {
        setAllowed(true);
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      setAllowed(profile?.role === "admin" || profile?.role === "organization" || user.user_metadata?.role === "admin");
      setLoading(false);
    }

    checkSession();
  }, [router]);

  async function signOut() {
    window.sessionStorage.removeItem("governance_preview");
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    router.replace("/login");
  }

  if (loading) {
    return <div className="login-page">جاري تحميل لوحة الحوكمة...</div>;
  }

  if (!allowed) {
    return (
      <div className="login-page">
        <section className="card login-card">
          <div className="card-body">
            <h1>صلاحية غير كافية</h1>
            <p className="muted">تأكد من وجود حسابك في جدول profiles بدور admin أو organization.</p>
            <button className="btn" onClick={signOut}>تسجيل الخروج</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ح</div>
          <div>
            <h1>نظام الحوكمة الذكي</h1>
            <p>إدارة وتقييم الجمعيات</p>
          </div>
        </div>
        <nav className="nav-list" aria-label="التنقل الرئيسي">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}>
                <Icon size={18} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <h2>{title}</h2>
            <p>منصة عربية موحدة لمتابعة الالتزام، التقييم، والتقارير.</p>
          </div>
          <button className="btn secondary no-print" onClick={signOut}>
            <LogOut size={17} />
            خروج
          </button>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
