"use client";

import { useEffect, useState } from "react";
import { supabase } from "../ilb/supabase";

export default function OrganizationsPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    getOrganizations();
  }, []);

  async function getOrganizations() {
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    setOrganizations(data || []);
  }

  async function addOrganization() {
    const { error } = await supabase.from("organizations").insert([
      {
        name,
        category,
        city,
      },
    ]);

    if (error) {
      setMessage("حدث خطأ أثناء الحفظ");
    } else {
      setMessage("تمت إضافة الجمعية بنجاح");
      setName("");
      setCategory("");
      setCity("");
      getOrganizations();
    }
  }

  return (
    <main style={{ padding: "40px", direction: "rtl", background: "#f5f7fb", minHeight: "100vh" }}>
      <h1>إضافة جمعية</h1>

      <div style={box}>
        <input placeholder="اسم الجمعية" value={name} onChange={(e) => setName(e.target.value)} style={input} />
        <input placeholder="نوع الجمعية" value={category} onChange={(e) => setCategory(e.target.value)} style={input} />
        <input placeholder="المدينة" value={city} onChange={(e) => setCity(e.target.value)} style={input} />

        <button onClick={addOrganization} style={button}>حفظ الجمعية</button>
        <p>{message}</p>
      </div>

      <h2 style={{ marginTop: "30px" }}>الجمعيات المسجلة</h2>

      <div style={{ display: "grid", gap: "12px", marginTop: "15px" }}>
        {organizations.map((org) => (
          <div key={org.id} style={box}>
            <h3>{org.name}</h3>
            <p>النوع: {org.category}</p>
            <p>المدينة: {org.city}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

const box = {
  background: "#fff",
  padding: "25px",
  borderRadius: "16px",
  maxWidth: "700px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
};

const input = {
  width: "100%",
  padding: "14px",
  marginBottom: "12px",
  borderRadius: "10px",
  border: "1px solid #ddd",
};

const button = {
  width: "100%",
  padding: "14px",
  background: "#111827",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
};