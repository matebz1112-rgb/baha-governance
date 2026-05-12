"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/app/lib/supabase";
import type { Assessment, Attachment, Organization } from "@/app/lib/types";
import { demoAssessments, demoAttachments, demoOrganizations } from "@/app/lib/demo-data";

export default function ReportsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        setOrganizations(demoOrganizations);
        setAssessments(demoAssessments);
        setAttachments(demoAttachments);
        return;
      }

      const [{ data: orgs }, { data: assessmentRows }, { data: attachmentRows }] = await Promise.all([
        supabase.from("organizations").select("*").order("name"),
        supabase.from("assessments").select("*, organizations(name, category, city)").order("created_at", { ascending: false }),
        supabase.from("attachments").select("*, organizations(name)").order("created_at", { ascending: false })
      ]);
      setOrganizations((orgs ?? []) as Organization[]);
      setAssessments((assessmentRows ?? []) as Assessment[]);
      setAttachments((attachmentRows ?? []) as Attachment[]);
    }
    load();
  }, []);

  const reportAssessments = useMemo(
    () => assessments.filter((item) => (organizationId ? item.organization_id === organizationId : true)),
    [assessments, organizationId]
  );

  const reportAttachments = useMemo(
    () => attachments.filter((item) => (organizationId ? item.organization_id === organizationId : true)),
    [attachments, organizationId]
  );

  const average = reportAssessments.length
    ? Math.round(reportAssessments.reduce((sum, item) => sum + Number(item.percentage), 0) / reportAssessments.length)
    : 0;

  return (
    <div className="grid">
      <section className="card no-print">
        <div className="card-header">
          <div>
            <h3>إعداد التقرير</h3>
            <p>يمكن طباعة الصفحة أو حفظها PDF من نافذة الطباعة</p>
          </div>
          <button className="btn" onClick={() => window.print()}><Printer size={17} />تصدير PDF</button>
        </div>
        <div className="card-body">
          <div className="field">
            <label>الجمعية</label>
            <select className="select" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
              <option value="">كل الجمعيات</option>
              {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h3>تقرير الحوكمة التفصيلي</h3>
            <p>نظام الحوكمة الذكي</p>
          </div>
          <span className="badge">نسبة الإنجاز {average}%</span>
        </div>
        <div className="card-body grid">
          <section className="grid grid-3">
            <div className="card stat"><div><span>عدد الجمعيات</span><strong>{organizationId ? 1 : organizations.length}</strong></div></div>
            <div className="card stat"><div><span>عدد التقييمات</span><strong>{reportAssessments.length}</strong></div></div>
            <div className="card stat"><div><span>عدد المرفقات</span><strong>{reportAttachments.length}</strong></div></div>
          </section>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الجمعية</th>
                  <th>المدينة</th>
                  <th>الدرجة</th>
                  <th>النسبة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {reportAssessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td>{assessment.organizations?.name}</td>
                    <td>{assessment.organizations?.city}</td>
                    <td>{assessment.total_score} / {assessment.max_score}</td>
                    <td>{assessment.percentage}%</td>
                    <td>{assessment.created_at ? new Date(assessment.created_at).toLocaleDateString("ar-SA") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
