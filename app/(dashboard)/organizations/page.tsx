"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Search, Trash2, X } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/app/lib/supabase";
import type { Organization } from "@/app/lib/types";
import { useToast } from "@/app/components/ToastProvider";
import { demoOrganizations } from "@/app/lib/demo-data";

const categories = ["خيرية", "تنموية", "صحية", "تعليمية", "ثقافية", "أخرى"];
const statuses = [
  { value: "pending", label: "قيد المراجعة" },
  { value: "active", label: "مفعلة" },
  { value: "suspended", label: "موقوفة" }
];

const emptyForm = {
  email: "",
  name: "",
  category: categories[0],
  city: "",
  license_number: "",
  phone: "",
  representative_name: "",
  representative_position: "",
  website: "",
  address: "",
  status: "pending" as Organization["status"]
};

export default function OrganizationsPage() {
  const { showToast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [form, setForm] = useState(emptyForm);

  async function loadOrganizations() {
    if (!isSupabaseConfigured) {
      setOrganizations(demoOrganizations);
      return;
    }

    const { data, error } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
    if (error) {
      showToast("تعذر تحميل الجمعيات", "error");
      return;
    }
    setOrganizations((data ?? []) as Organization[]);
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  const filtered = useMemo(() => {
    return organizations.filter((item) => {
      const matchesQuery = [
        item.name,
        item.category,
        item.city,
        item.email,
        item.license_number,
        item.representative_name
      ].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
      return matchesQuery && matchesCategory;
    });
  }, [organizations, query, categoryFilter]);

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      email: form.email.trim() || null,
      name: form.name.trim(),
      category: form.category,
      city: form.city.trim(),
      license_number: form.license_number.trim() || null,
      phone: form.phone.trim() || null,
      representative_name: form.representative_name.trim() || null,
      representative_position: form.representative_position.trim() || null,
      website: form.website.trim() || null,
      address: form.address.trim() || null,
      status: form.status ?? "pending"
    };

    if (!isSupabaseConfigured) {
      if (editingId) {
        setOrganizations((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      } else {
        setOrganizations((current) => [{ id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() }, ...current]);
      }
      showToast(editingId ? "تم تعديل الجمعية في المعاينة" : "تمت إضافة الجمعية في المعاينة", "success");
      resetForm();
      return;
    }

    const request = editingId
      ? supabase.from("organizations").update(payload).eq("id", editingId)
      : supabase.from("organizations").insert(payload);
    const { error } = await request;

    if (error) {
      showToast("تعذر حفظ بيانات الجمعية", "error");
      return;
    }

    showToast(editingId ? "تم تعديل الجمعية" : "تمت إضافة الجمعية", "success");
    resetForm();
    loadOrganizations();
  }

  function startEdit(organization: Organization) {
    setEditingId(organization.id);
    setForm({
      email: organization.email ?? "",
      name: organization.name,
      category: organization.category,
      city: organization.city,
      license_number: organization.license_number ?? "",
      phone: organization.phone ?? "",
      representative_name: organization.representative_name ?? "",
      representative_position: organization.representative_position ?? "",
      website: organization.website ?? "",
      address: organization.address ?? "",
      status: organization.status ?? "pending"
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function removeOrganization(id: string) {
    if (!window.confirm("هل تريد حذف هذه الجمعية؟")) return;
    if (!isSupabaseConfigured) {
      setOrganizations((current) => current.filter((item) => item.id !== id));
      showToast("تم حذف الجمعية في المعاينة", "success");
      return;
    }

    const { error } = await supabase.from("organizations").delete().eq("id", id);
    if (error) {
      showToast("تعذر حذف الجمعية لوجود بيانات مرتبطة", "error");
      return;
    }
    showToast("تم حذف الجمعية", "success");
    loadOrganizations();
  }

  return (
    <div className="grid">
      <section className="card">
        <div className="card-header">
          <div>
            <h3>{editingId ? "تعديل جمعية" : "إضافة جمعية"}</h3>
            <p>يمكن للمدير إضافة جمعية يدويًا أو مراجعة بيانات الجمعيات المسجلة بالبريد.</p>
          </div>
        </div>
        <form className="card-body form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>البريد الإلكتروني</label>
              <input className="input" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
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
              <label>الهاتف</label>
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
              <label>الحالة</label>
              <select className="select" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>العنوان / الموقع</label>
            <input className="input" value={form.address} onChange={(event) => updateField("address", event.target.value)} />
          </div>
          <div className="actions">
            <button className="btn" type="submit"><Plus size={17} />{editingId ? "حفظ التعديل" : "إضافة الجمعية"}</button>
            {editingId ? <button className="btn secondary" type="button" onClick={resetForm}><X size={17} />إلغاء</button> : null}
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h3>قائمة الجمعيات</h3>
            <p>بحث وتصفية ومراجعة بيانات الحسابات المسجلة.</p>
          </div>
        </div>
        <div className="card-body">
          <div className="toolbar">
            <div className="field" style={{ flex: 1 }}>
              <label><Search size={14} /> البحث</label>
              <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="اسم الجمعية أو البريد أو رقم الترخيص" />
            </div>
            <div className="field">
              <label>التصفية حسب النوع</label>
              <select className="select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="">الكل</option>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد</th>
                  <th>النوع</th>
                  <th>المدينة</th>
                  <th>الترخيص</th>
                  <th>ممثل الجمعية</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((organization) => (
                  <tr key={organization.id}>
                    <td>{organization.name}</td>
                    <td>{organization.email ?? "-"}</td>
                    <td>{organization.category}</td>
                    <td>{organization.city}</td>
                    <td>{organization.license_number ?? "-"}</td>
                    <td>{organization.representative_name ?? "-"}</td>
                    <td><span className="badge">{statuses.find((status) => status.value === organization.status)?.label ?? "قيد المراجعة"}</span></td>
                    <td>
                      <div className="actions">
                        <button className="btn ghost" title="تعديل" onClick={() => startEdit(organization)}><Edit2 size={16} /></button>
                        <button className="btn ghost" title="حذف" onClick={() => removeOrganization(organization.id)}><Trash2 size={16} /></button>
                      </div>
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
