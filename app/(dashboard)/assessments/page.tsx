"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/app/lib/supabase";
import type { Organization, Question } from "@/app/lib/types";
import { useToast } from "@/app/components/ToastProvider";
import { demoOrganizations, demoQuestions } from "@/app/lib/demo-data";
import { evaluationTools, loadEvaluationToolQuestions, type EvaluationTool } from "@/app/lib/evaluation-tools";

type AssessmentQuestion = Question & {
  tool_question_id?: string;
};

export default function AssessmentsPage() {
  const { showToast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [databaseQuestions, setDatabaseQuestions] = useState<AssessmentQuestion[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [toolSlug, setToolSlug] = useState("database");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadBase() {
      if (!isSupabaseConfigured) {
        setOrganizations(demoOrganizations);
        setDatabaseQuestions(demoQuestions);
        setQuestions(demoQuestions);
        return;
      }

      const [{ data: orgs }, { data: qs }] = await Promise.all([
        supabase.from("organizations").select("*").order("name"),
        supabase.from("questions").select("*, standards(title)").order("created_at")
      ]);
      setOrganizations((orgs ?? []) as Organization[]);
      setDatabaseQuestions((qs ?? []) as AssessmentQuestion[]);
      setQuestions((qs ?? []) as AssessmentQuestion[]);
    }
    loadBase();
  }, []);

  async function loadToolQuestions(tool: EvaluationTool) {
    if (isSupabaseConfigured) {
      const { data: toolRecord } = await supabase.from("evaluation_tools").select("id").eq("slug", tool.slug).maybeSingle();
      if (toolRecord) {
        const { data: rows } = await supabase
          .from("evaluation_tool_questions")
          .select("*")
          .eq("evaluation_tool_id", toolRecord.id)
          .order("sort_order");

        if (rows?.length) {
          return rows.map((row) => ({
            id: row.id,
            tool_question_id: row.id,
            standard_id: row.standard_title,
            question: row.question,
            max_score: Number(row.max_score),
            standards: { title: row.standard_title }
          })) as AssessmentQuestion[];
        }
      }
    }

    const parsedQuestions = await loadEvaluationToolQuestions(tool);
    return parsedQuestions.map((question) => ({
      id: question.id,
      standard_id: question.standard,
      question: question.question,
      max_score: question.maxScore,
      standards: { title: question.standard }
    })) as AssessmentQuestion[];
  }

  async function ensureToolInDatabase(tool: EvaluationTool) {
    const parsedQuestions = await loadEvaluationToolQuestions(tool);
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
      throw new Error("تعذر حفظ أداة التقييم في قاعدة البيانات");
    }

    await supabase.from("evaluation_tool_questions").delete().eq("evaluation_tool_id", toolRecord.id);
    const { data: insertedQuestions, error: questionsError } = await supabase
      .from("evaluation_tool_questions")
      .insert(parsedQuestions.map((question, index) => ({
        evaluation_tool_id: toolRecord.id,
        standard_title: question.standard,
        question_number: question.number,
        question: question.question,
        max_score: question.maxScore,
        evidence: question.evidence,
        sort_order: index + 1
      })))
      .select("*")
      .order("sort_order");

    if (questionsError || !insertedQuestions) {
      throw new Error("تعذر حفظ أسئلة أداة التقييم");
    }

    return {
      toolId: toolRecord.id as string,
      questions: insertedQuestions.map((row) => ({
        id: row.id,
        tool_question_id: row.id,
        standard_id: row.standard_title,
        question: row.question,
        max_score: Number(row.max_score),
        standards: { title: row.standard_title }
      })) as AssessmentQuestion[]
    };
  }

  async function changeTool(nextToolSlug: string) {
    setToolSlug(nextToolSlug);
    setScores({});
    setNotes({});

    if (nextToolSlug === "database") {
      setQuestions(databaseQuestions);
      return;
    }

    const tool = evaluationTools.find((item) => item.slug === nextToolSlug);
    if (!tool) return;
    setQuestions(await loadToolQuestions(tool));
  }

  const totals = useMemo(() => {
    const totalScore = questions.reduce((sum, question) => sum + Number(scores[question.id] ?? 0), 0);
    const maxScore = questions.reduce((sum, question) => sum + Number(question.max_score), 0);
    const percentage = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;
    return { totalScore, maxScore, percentage };
  }, [questions, scores]);

  async function saveAssessment() {
    if (!organizationId) {
      showToast("اختر الجمعية أولًا", "error");
      return;
    }

    if (!isSupabaseConfigured) {
      showToast(`تم احتساب التقييم في المعاينة بنسبة ${totals.percentage}%`, "success");
      setScores({});
      setNotes({});
      return;
    }

    try {
      let evaluationToolId: string | null = null;
      let questionsToSave = questions;
      const selectedTool = evaluationTools.find((tool) => tool.slug === toolSlug);

      if (selectedTool) {
        const synced = await ensureToolInDatabase(selectedTool);
        evaluationToolId = synced.toolId;
        questionsToSave = synced.questions;
        setQuestions(synced.questions);
      }

      const { data: assessment, error } = await supabase
        .from("assessments")
        .insert({
          organization_id: organizationId,
          evaluation_tool_id: evaluationToolId,
          total_score: totals.totalScore,
          max_score: totals.maxScore,
          percentage: totals.percentage,
          status: "completed"
        })
        .select("id")
        .single();

      if (error || !assessment) {
        throw new Error("تعذر حفظ التقييم");
      }

      const answers = questionsToSave.map((question, index) => {
        const sourceQuestionId = selectedTool ? questions[index]?.id ?? question.id : question.id;
        return {
          assessment_id: assessment.id,
          question_id: selectedTool ? null : question.id,
          tool_question_id: selectedTool ? question.tool_question_id ?? question.id : null,
          score: Number(scores[sourceQuestionId] ?? 0),
          note: notes[sourceQuestionId] ?? ""
        };
      });

      const { error: answersError } = await supabase.from("assessment_answers").insert(answers);
      if (answersError) {
        throw new Error("تم حفظ التقييم دون حفظ كل الإجابات");
      }

      showToast("تم حفظ التقييم والإجابات في قاعدة البيانات", "success");
      setScores({});
      setNotes({});
    } catch (error) {
      showToast(error instanceof Error ? error.message : "تعذر حفظ التقييم", "error");
    }
  }

  return (
    <div className="grid">
      <section className="grid grid-3">
        <div className="card stat"><div><span>الدرجة المحققة</span><strong>{totals.totalScore}</strong></div></div>
        <div className="card stat"><div><span>الدرجة القصوى</span><strong>{totals.maxScore}</strong></div></div>
        <div className="card stat"><div><span>النسبة</span><strong>{totals.percentage}%</strong></div></div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h3>تعبئة التقييم</h3>
            <p>اختر أداة التقييم والجمعية ثم أدخل الدرجات لكل سؤال.</p>
          </div>
          <button className="btn no-print" onClick={saveAssessment}><Save size={17} />حفظ التقييم</button>
        </div>
        <div className="card-body form">
          <div className="form-grid">
            <div className="field">
              <label>أداة التقييم</label>
              <select className="select" value={toolSlug} onChange={(event) => changeTool(event.target.value)}>
                <option value="database">الأسئلة المسجلة في النظام</option>
                {evaluationTools.map((tool) => <option key={tool.slug} value={tool.slug}>{tool.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label>الجمعية</label>
              <select className="select" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} required>
                <option value="">اختر الجمعية</option>
                {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>المعيار</th>
                  <th>السؤال</th>
                  <th>الدرجة</th>
                  <th>ملاحظة</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question.id}>
                    <td>{question.standards?.title}</td>
                    <td>{question.question}</td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        max={question.max_score}
                        value={scores[question.id] ?? 0}
                        onChange={(event) => setScores({ ...scores, [question.id]: Math.min(Number(event.target.value), Number(question.max_score)) })}
                      />
                      <span className="muted">من {question.max_score}</span>
                    </td>
                    <td>
                      <input className="input" value={notes[question.id] ?? ""} onChange={(event) => setNotes({ ...notes, [question.id]: event.target.value })} />
                    </td>
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
