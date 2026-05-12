"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/app/lib/supabase";
import type { Question, Standard } from "@/app/lib/types";
import { useToast } from "@/app/components/ToastProvider";
import { demoQuestions, demoStandards } from "@/app/lib/demo-data";

export default function QuestionsPage() {
  const { showToast } = useToast();
  const [standards, setStandards] = useState<Standard[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState({ standard_id: "", question: "", max_score: 5 });

  async function load() {
    if (!isSupabaseConfigured) {
      setStandards(demoStandards);
      setQuestions(demoQuestions);
      return;
    }

    const [{ data: standardsData }, { data: questionsData }] = await Promise.all([
      supabase.from("standards").select("*").order("title"),
      supabase.from("questions").select("*, standards(title)").order("created_at", { ascending: false })
    ]);
    setStandards((standardsData ?? []) as Standard[]);
    setQuestions((questionsData ?? []) as Question[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function addQuestion(event: FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      const standard = standards.find((item) => item.id === form.standard_id);
      setQuestions((current) => [
        { id: crypto.randomUUID(), ...form, standards: { title: standard?.title ?? "" }, created_at: new Date().toISOString() },
        ...current
      ]);
      setForm({ standard_id: "", question: "", max_score: 5 });
      showToast("تمت إضافة السؤال في المعاينة", "success");
      return;
    }

    const { error } = await supabase.from("questions").insert(form);
    if (error) {
      showToast("تعذر إضافة السؤال", "error");
      return;
    }
    setForm({ standard_id: "", question: "", max_score: 5 });
    showToast("تمت إضافة السؤال", "success");
    load();
  }

  async function removeQuestion(id: string) {
    if (!window.confirm("هل تريد حذف هذا السؤال؟")) return;
    if (!isSupabaseConfigured) {
      setQuestions((current) => current.filter((item) => item.id !== id));
      showToast("تم حذف السؤال في المعاينة", "success");
      return;
    }

    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) {
      showToast("تعذر حذف السؤال", "error");
      return;
    }
    showToast("تم حذف السؤال", "success");
    load();
  }

  return (
    <div className="grid">
      <section className="card">
        <div className="card-header">
          <div>
            <h3>إضافة سؤال تقييم</h3>
            <p>كل سؤال يرتبط بمعيار وتحدد له الدرجة القصوى</p>
          </div>
        </div>
        <form className="card-body form" onSubmit={addQuestion}>
          <div className="form-grid">
            <div className="field">
              <label>المعيار</label>
              <select className="select" value={form.standard_id} onChange={(event) => setForm({ ...form, standard_id: event.target.value })} required>
                <option value="">اختر المعيار</option>
                {standards.map((standard) => <option key={standard.id} value={standard.id}>{standard.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label>نص السؤال</label>
              <input className="input" value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} required />
            </div>
            <div className="field">
              <label>الدرجة القصوى</label>
              <input className="input" type="number" min={1} max={100} value={form.max_score} onChange={(event) => setForm({ ...form, max_score: Number(event.target.value) })} />
            </div>
          </div>
          <button className="btn" type="submit"><Plus size={17} />إضافة السؤال</button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>الأسئلة المسجلة</h3>
        </div>
        <div className="card-body table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>المعيار</th>
                <th>السؤال</th>
                <th>الدرجة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id}>
                  <td>{question.standards?.title}</td>
                  <td>{question.question}</td>
                  <td>{question.max_score}</td>
                  <td><button className="btn ghost" onClick={() => removeQuestion(question.id)}><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
