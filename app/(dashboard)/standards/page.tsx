"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/app/lib/supabase";
import type { Organization, Standard } from "@/app/lib/types";
import { useToast } from "@/app/components/ToastProvider";
import { demoOrganizations, demoStandards } from "@/app/lib/demo-data";

export default function StandardsPage() {
  const { showToast } = useToast();
  const [standards, setStandards] = useState<Standard[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedStandard, setSelectedStandard] = useState("");
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [form, setForm] = useState({ title: "", description: "", weight: 10 });

  async function load() {
    if (!isSupabaseConfigured) {
      setStandards(demoStandards);
      setOrganizations(demoOrganizations);
      return;
    }

    const [{ data: standardsData }, { data: orgsData }] = await Promise.all([
      supabase.from("standards").select("*").order("created_at", { ascending: false }),
      supabase.from("organizations").select("*").order("name")
    ]);
    setStandards((standardsData ?? []) as Standard[]);
    setOrganizations((orgsData ?? []) as Organization[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function addStandard(event: FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setStandards((current) => [
        { id: crypto.randomUUID(), title: form.title, description: form.description, weight: form.weight, created_at: new Date().toISOString() },
        ...current
      ]);
      setForm({ title: "", description: "", weight: 10 });
      showToast("تمت إضافة المعيار في المعاينة", "success");
      return;
    }

    const { error } = await supabase.from("standards").insert({
      title: form.title.trim(),
      description: form.description.trim(),
      weight: form.weight
    });
    if (error) {
      showToast("تعذر إضافة المعيار", "error");
      return;
    }
    setForm({ title: "", description: "", weight: 10 });
    showToast("تمت إضافة المعيار", "success");
    load();
  }

  async function removeStandard(id: string) {
    if (!window.confirm("هل تريد حذف هذا المعيار؟")) return;
    if (!isSupabaseConfigured) {
      setStandards((current) => current.filter((item) => item.id !== id));
      showToast("تم حذف المعيار في المعاينة", "success");
      return;
    }

    const { error } = await supabase.from("standards").delete().eq("id", id);
    if (error) {
      showToast("تعذر حذف المعيار", "error");
      return;
    }
    showToast("تم حذف المعيار", "success");
    load();
  }

  async function saveLinks() {
    if (!selectedStandard) return;
    if (!isSupabaseConfigured) {
      showToast("تم حفظ الربط في المعاينة", "success");
      return;
    }

    await supabase.from("organization_standards").delete().eq("standard_id", selectedStandard);
    const rows = selectedOrganizations.map((organization_id) => ({ standard_id: selectedStandard, organization_id }));
    const { error } = rows.length ? await supabase.from("organization_standards").insert(rows) : { error: null };
    if (error) {
      showToast("تعذر ربط المعيار بالجمعيات", "error");
      return;
    }
    showToast("تم حفظ الربط", "success");
  }

  async function loadLinks(standardId: string) {
    setSelectedStandard(standardId);
    if (!isSupabaseConfigured) {
      setSelectedOrganizations(demoOrganizations.map((item) => item.id));
      return;
    }

    const { data } = await supabase.from("organization_standards").select("organization_id").eq("standard_id", standardId);
    setSelectedOrganizations((data ?? []).map((row) => row.organization_id));
  }

  return (
    <div className="grid grid-2">
      <section className="card">
        <div className="card-header">
          <div>
            <h3>إضافة معيار حوكمة</h3>
            <p>تعريف معايير قابلة للقياس والربط بالجمعيات</p>
          </div>
        </div>
        <form className="card-body form" onSubmit={addStandard}>
          <div className="field">
            <label>اسم المعيار</label>
            <input className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </div>
          <div className="field">
            <label>الوصف</label>
            <textarea className="textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div className="field">
            <label>الوزن النسبي</label>
            <input className="input" type="number" min={1} max={100} value={form.weight} onChange={(event) => setForm({ ...form, weight: Number(event.target.value) })} />
          </div>
          <button className="btn" type="submit"><Plus size={17} />إضافة المعيار</button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h3>ربط المعايير بالجمعيات</h3>
            <p>اختر معيارًا ثم حدد الجمعيات المشمولة به</p>
          </div>
        </div>
        <div className="card-body form">
          <div className="field">
            <label>المعيار</label>
            <select className="select" value={selectedStandard} onChange={(event) => loadLinks(event.target.value)}>
              <option value="">اختر معيارًا</option>
              {standards.map((standard) => <option key={standard.id} value={standard.id}>{standard.title}</option>)}
            </select>
          </div>
          <div className="grid">
            {organizations.map((organization) => (
              <label key={organization.id} className="card" style={{ padding: 12, boxShadow: "none" }}>
                <input
                  type="checkbox"
                  checked={selectedOrganizations.includes(organization.id)}
                  onChange={(event) => {
                    setSelectedOrganizations((current) =>
                      event.target.checked ? [...current, organization.id] : current.filter((id) => id !== organization.id)
                    );
                  }}
                />
                {" "}{organization.name}
              </label>
            ))}
          </div>
          <button className="btn" type="button" onClick={saveLinks}><Save size={17} />حفظ الربط</button>
        </div>
      </section>

      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <div className="card-header">
          <h3>المعايير المسجلة</h3>
        </div>
        <div className="card-body table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>المعيار</th>
                <th>الوصف</th>
                <th>الوزن</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {standards.map((standard) => (
                <tr key={standard.id}>
                  <td>{standard.title}</td>
                  <td>{standard.description}</td>
                  <td>{standard.weight}%</td>
                  <td><button className="btn ghost" onClick={() => removeStandard(standard.id)}><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
