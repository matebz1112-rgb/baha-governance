"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Database, Download, ListChecks } from "lucide-react";
import { useToast } from "@/app/components/ToastProvider";
import { isSupabaseConfigured, supabase } from "@/app/lib/supabase";
import { evaluationTools, loadEvaluationToolQuestions, type EvaluationTool, type ParsedEvaluationQuestion } from "@/app/lib/evaluation-tools";

export default function EvaluationToolsPage() {
  const { showToast } = useToast();
  const [counts, setCounts] = useState<Record<string, { questions: number; score: number }>>({});
  const [preview, setPreview] = useState<ParsedEvaluationQuestion[]>([]);
  const [activeTitle, setActiveTitle] = useState("");
  const [syncingSlug, setSyncingSlug] = useState("");

  useEffect(() => {
    async function loadCounts() {
      const entries = await Promise.all(
        evaluationTools.map(async (tool) => {
          const questions = await loadEvaluationToolQuestions(tool);
          return [
            tool.slug,
            {
              questions: questions.length,
              score: questions.reduce((sum, question) => sum + question.maxScore, 0)
            }
          ] as const;
        })
      );
      setCounts(Object.fromEntries(entries));
    }
    loadCounts();
  }, []);

  async function showPreview(slug: string) {
    const tool = evaluationTools.find((item) => item.slug === slug);
    if (!tool) return;
    const questions = await loadEvaluationToolQuestions(tool);
    setActiveTitle(tool.title);
    setPreview(questions.slice(0, 12));
  }

  async function syncTool(tool: EvaluationTool) {
    if (!isSupabaseConfigured) {
      showToast("المزامنة الحقيقية تحتاج ربط Supabase.", "error");
      return;
    }

    setSyncingSlug(tool.slug);
    const questions = await loadEvaluationToolQuestions(tool);
    const { data: toolRecord, error: toolError } = await supabase
      .from("evaluation_tools")
      .upsert({
        slug: tool.slug,
        title: tool.title,
        audience: tool.audience,
        year: tool.year,
        source_file: tool.sourceFile
      }, { onConflict: "slug" })
      .select("id")
      .single();

    if (toolError || !toolRecord) {
      setSyncingSlug("");
      showToast("تعذر حفظ أداة التقييم. تأكد أنك داخل بحساب مدير.", "error");
      return;
    }

    await supabase.from("evaluation_tool_questions").delete().eq("evaluation_tool_id", toolRecord.id);
    const { error: questionsError } = await supabase.from("evaluation_tool_questions").insert(
      questions.map((question, index) => ({
        evaluation_tool_id: toolRecord.id,
        standard_title: question.standard,
        question_number: question.number,
        question: question.question,
        max_score: question.maxScore,
        evidence: question.evidence,
        sort_order: index + 1
      }))
    );

    setSyncingSlug("");
    if (questionsError) {
      showToast("تم حفظ الأداة، لكن تعذر حفظ أسئلتها.", "error");
      return;
    }
    showToast("تمت مزامنة أداة التقييم مع قاعدة البيانات.", "success");
  }

  return (
    <div className="grid">
      <section className="grid grid-2">
        {evaluationTools.map((tool) => {
          const stat = counts[tool.slug];
          return (
            <article className="card" key={tool.slug}>
              <div className="card-header">
                <div>
                  <h3>{tool.title}</h3>
                  <p>{tool.audience} - ملف Markdown مضاف داخل المشروع</p>
                </div>
                <div className="stat-icon"><ClipboardCheck /></div>
              </div>
              <div className="card-body grid">
                <div className="grid grid-2">
                  <div className="card stat" style={{ boxShadow: "none" }}>
                    <div><span>عدد الأسئلة</span><strong>{stat?.questions ?? "..."}</strong></div>
                  </div>
                  <div className="card stat" style={{ boxShadow: "none" }}>
                    <div><span>إجمالي الدرجات</span><strong>{stat?.score ?? "..."}</strong></div>
                  </div>
                </div>
                <p className="muted">المصدر: {tool.sourceFile}</p>
                <div className="actions">
                  <button className="btn secondary" onClick={() => showPreview(tool.slug)}>
                    <ListChecks size={17} />
                    معاينة الأسئلة
                  </button>
                  <button className="btn" onClick={() => syncTool(tool)} disabled={syncingSlug === tool.slug}>
                    <Database size={17} />
                    {syncingSlug === tool.slug ? "جاري المزامنة..." : "مزامنة مع قاعدة البيانات"}
                  </button>
                  <Link className="btn secondary" href={tool.fileUrl} target="_blank">
                    <Download size={17} />
                    فتح الملف
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h3>{activeTitle || "معاينة أداة التقييم"}</h3>
            <p>اختر إحدى الأدوات لعرض عينة من الأسئلة والشواهد.</p>
          </div>
        </div>
        <div className="card-body table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>المعيار</th>
                <th>رقم السؤال</th>
                <th>السؤال</th>
                <th>الدرجة</th>
                <th>الشواهد</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((question) => (
                <tr key={question.id}>
                  <td>{question.standard}</td>
                  <td>{question.number}</td>
                  <td>{question.question}</td>
                  <td>{question.maxScore}</td>
                  <td>{question.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
