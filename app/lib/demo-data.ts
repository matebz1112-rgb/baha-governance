import type { Assessment, Attachment, Organization, Question, Standard } from "./types";

export const demoOrganizations: Organization[] = [
  { id: "org-1", name: "جمعية البر النموذجية", category: "خيرية", city: "الرياض", created_at: new Date().toISOString() },
  { id: "org-2", name: "جمعية تمكين الأهلية", category: "تنموية", city: "جدة", created_at: new Date().toISOString() },
  { id: "org-3", name: "جمعية أثر الصحية", category: "صحية", city: "الدمام", created_at: new Date().toISOString() }
];

export const demoStandards: Standard[] = [
  { id: "std-1", title: "الشفافية والإفصاح", description: "توثيق السياسات ونشر المعلومات الأساسية.", weight: 30 },
  { id: "std-2", title: "إدارة المخاطر", description: "وجود سجل مخاطر وخطط معالجة واضحة.", weight: 25 },
  { id: "std-3", title: "فاعلية مجلس الإدارة", description: "انتظام الاجتماعات ومتابعة القرارات.", weight: 45 }
];

export const demoQuestions: Question[] = [
  { id: "q-1", standard_id: "std-1", question: "هل تنشر الجمعية تقاريرها المالية السنوية؟", max_score: 5, standards: { title: "الشفافية والإفصاح" } },
  { id: "q-2", standard_id: "std-1", question: "هل توجد سياسة تعارض مصالح معتمدة؟", max_score: 5, standards: { title: "الشفافية والإفصاح" } },
  { id: "q-3", standard_id: "std-2", question: "هل يوجد سجل مخاطر محدث؟", max_score: 10, standards: { title: "إدارة المخاطر" } },
  { id: "q-4", standard_id: "std-3", question: "هل يتم توثيق محاضر مجلس الإدارة؟", max_score: 10, standards: { title: "فاعلية مجلس الإدارة" } }
];

export const demoAssessments: Assessment[] = [
  {
    id: "assess-1",
    organization_id: "org-1",
    total_score: 26,
    max_score: 30,
    percentage: 87,
    status: "completed",
    created_at: new Date().toISOString(),
    organizations: { name: "جمعية البر النموذجية", category: "خيرية", city: "الرياض" }
  },
  {
    id: "assess-2",
    organization_id: "org-2",
    total_score: 21,
    max_score: 30,
    percentage: 70,
    status: "completed",
    created_at: new Date().toISOString(),
    organizations: { name: "جمعية تمكين الأهلية", category: "تنموية", city: "جدة" }
  }
];

export const demoAttachments: Attachment[] = [
  {
    id: "att-1",
    organization_id: "org-1",
    file_name: "تقرير الحوكمة.pdf",
    file_path: "demo/report.pdf",
    file_type: "application/pdf",
    file_size: 310000,
    created_at: new Date().toISOString(),
    organizations: { name: "جمعية البر النموذجية" }
  }
];
