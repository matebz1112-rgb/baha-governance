"use client";

import { useEffect, useState } from "react";
import { BarChart3, Building2, ClipboardCheck, ClipboardList, FileArchive } from "lucide-react";
import { StatCard } from "@/app/components/StatCard";
import { isSupabaseConfigured, supabase } from "@/app/lib/supabase";
import type { Assessment, Organization } from "@/app/lib/types";
import { demoAssessments, demoAttachments, demoOrganizations } from "@/app/lib/demo-data";
import { evaluationTools } from "@/app/lib/evaluation-tools";

export default function DashboardPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attachmentsCount, setAttachmentsCount] = useState(0);
  const [toolsCount, setToolsCount] = useState(evaluationTools.length);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        setOrganizations(demoOrganizations);
        setAssessments(demoAssessments);
        setAttachmentsCount(demoAttachments.length);
        setToolsCount(evaluationTools.length);
        return;
      }

      const [{ data: orgs }, { data: assessmentRows }, { count: attachments }, { count: tools }] = await Promise.all([
        supabase.from("organizations").select("*").order("created_at", { ascending: false }),
        supabase.from("assessments").select("*, organizations(name, category, city)").order("created_at", { ascending: false }).limit(6),
        supabase.from("attachments").select("*", { count: "exact", head: true }),
        supabase.from("evaluation_tools").select("*", { count: "exact", head: true })
      ]);
      setOrganizations((orgs ?? []) as Organization[]);
      setAssessments((assessmentRows ?? []) as Assessment[]);
      setAttachmentsCount(attachments ?? 0);
      setToolsCount(tools ?? evaluationTools.length);
    }
    load();
  }, []);

  const averageCompletion = assessments.length
    ? Math.round(assessments.reduce((sum, item) => sum + Number(item.percentage ?? 0), 0) / assessments.length)
    : 0;

  return (
    <div className="grid">
      <section className="grid grid-4">
        <StatCard title="إجمالي الجمعيات" value={organizations.length} icon={Building2} />
        <StatCard title="إجمالي التقييمات" value={assessments.length} icon={ClipboardCheck} />
        <StatCard title="نسبة الإنجاز" value={`${averageCompletion}%`} icon={BarChart3} />
        <StatCard title="عدد المرفقات" value={attachmentsCount} icon={FileArchive} />
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>أدوات التقييم</h3>
              <p>الأدوات المتاحة للتقييم الذاتي لعام 2025</p>
            </div>
            <span className="badge">{toolsCount} أدوات</span>
          </div>
          <div className="card-body grid">
            {evaluationTools.map((tool) => (
              <div className="card" key={tool.slug} style={{ padding: 14, boxShadow: "none" }}>
                <div className="actions" style={{ justifyContent: "space-between" }}>
                  <div>
                    <strong>{tool.title}</strong>
                    <p className="muted" style={{ margin: "6px 0 0" }}>{tool.audience}</p>
                  </div>
                  <ClipboardList size={22} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>آخر التقييمات</h3>
              <p>متوسطات الأداء حسب الجمعية</p>
            </div>
          </div>
          <div className="card-body table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الجمعية</th>
                  <th>النسبة</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td>{assessment.organizations?.name ?? "غير محدد"}</td>
                    <td>
                      <div className="progress"><div style={{ width: `${assessment.percentage}%` }} /></div>
                      <span className="muted">{assessment.percentage}%</span>
                    </td>
                    <td><span className="badge">{assessment.status === "completed" ? "مكتمل" : "مسودة"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h3>الجمعيات المسجلة</h3>
            <p>أحدث الجمعيات في النظام</p>
          </div>
        </div>
        <div className="card-body table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>النوع</th>
                <th>المدينة</th>
                <th>البريد</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {organizations.slice(0, 8).map((organization) => (
                <tr key={organization.id}>
                  <td>{organization.name}</td>
                  <td>{organization.category}</td>
                  <td>{organization.city}</td>
                  <td>{organization.email ?? "-"}</td>
                  <td><span className="badge">{organization.status === "active" ? "مفعلة" : "قيد المراجعة"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
