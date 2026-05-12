"use client";

import { FormEvent, useEffect, useState } from "react";
import { Download, Upload } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/app/lib/supabase";
import type { Attachment, Organization } from "@/app/lib/types";
import { useToast } from "@/app/components/ToastProvider";
import { demoAttachments, demoOrganizations } from "@/app/lib/demo-data";

const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/webp"
];

export default function AttachmentsPage() {
  const { showToast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    if (!isSupabaseConfigured) {
      setOrganizations(demoOrganizations);
      setAttachments(demoAttachments);
      return;
    }

    const [{ data: orgs }, { data: rows }] = await Promise.all([
      supabase.from("organizations").select("*").order("name"),
      supabase.from("attachments").select("*, organizations(name)").order("created_at", { ascending: false })
    ]);
    setOrganizations((orgs ?? []) as Organization[]);
    setAttachments((rows ?? []) as Attachment[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadAttachment(event: FormEvent) {
    event.preventDefault();
    if (!organizationId || !file) {
      showToast("اختر الجمعية والملف", "error");
      return;
    }
    if (!isSupabaseConfigured) {
      const organization = organizations.find((item) => item.id === organizationId);
      setAttachments((current) => [
        {
          id: crypto.randomUUID(),
          organization_id: organizationId,
          file_name: file.name,
          file_path: `demo/${file.name}`,
          file_type: file.type,
          file_size: file.size,
          created_at: new Date().toISOString(),
          organizations: { name: organization?.name ?? "" }
        },
        ...current
      ]);
      setFile(null);
      showToast("تمت إضافة المرفق في المعاينة", "success");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      showToast("نوع الملف غير مدعوم", "error");
      return;
    }

    const path = `${organizationId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("governance-attachments").upload(path, file);
    if (uploadError) {
      showToast("تعذر رفع الملف إلى التخزين", "error");
      return;
    }

    const { error } = await supabase.from("attachments").insert({
      organization_id: organizationId,
      file_name: file.name,
      file_path: path,
      file_type: file.type,
      file_size: file.size
    });
    if (error) {
      showToast("تم رفع الملف لكن تعذر حفظ بياناته", "error");
      return;
    }
    setFile(null);
    showToast("تم رفع المرفق بنجاح", "success");
    load();
  }

  async function openAttachment(path: string) {
    if (!isSupabaseConfigured) {
      showToast("التحميل الحقيقي يعمل بعد ربط Supabase Storage", "info");
      return;
    }

    const { data, error } = await supabase.storage.from("governance-attachments").createSignedUrl(path, 60);
    if (error || !data) {
      showToast("تعذر إنشاء رابط التحميل", "error");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid">
      <section className="card">
        <div className="card-header">
          <div>
            <h3>رفع مرفق</h3>
            <p>PDF وWord وExcel والصور محفوظة داخل Supabase Storage</p>
          </div>
        </div>
        <form className="card-body form" onSubmit={uploadAttachment}>
          <div className="form-grid">
            <div className="field">
              <label>الجمعية</label>
              <select className="select" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} required>
                <option value="">اختر الجمعية</option>
                {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>الملف</label>
              <input className="input" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />
            </div>
          </div>
          <button className="btn" type="submit"><Upload size={17} />رفع المرفق</button>
        </form>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>المرفقات</h3>
        </div>
        <div className="card-body table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>الجمعية</th>
                <th>اسم الملف</th>
                <th>النوع</th>
                <th>الحجم</th>
                <th>تحميل</th>
              </tr>
            </thead>
            <tbody>
              {attachments.map((attachment) => (
                <tr key={attachment.id}>
                  <td>{attachment.organizations?.name}</td>
                  <td>{attachment.file_name}</td>
                  <td>{attachment.file_type}</td>
                  <td>{Math.round(attachment.file_size / 1024)} KB</td>
                  <td><button className="btn ghost" onClick={() => openAttachment(attachment.file_path)}><Download size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
