export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "40px",
        direction: "rtl",
      }}
    >
      <h1 style={{ fontSize: "38px", fontWeight: "bold" }}>
        نظام الحوكمة الذكي
      </h1>

      <p style={{ color: "#6b7280", marginBottom: "30px" }}>
        لوحة تحكم لإدارة التقييمات والحوكمة ورفع المرفقات
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div style={card}>
          <h3>إجمالي الجهات</h3>
          <h1 style={{ color: "#2563eb" }}>0</h1>
        </div>

        <div style={card}>
          <h3>إجمالي التقييمات</h3>
          <h1 style={{ color: "#16a34a" }}>0</h1>
        </div>

        <div style={card}>
          <h3>نسبة الإنجاز</h3>
          <h1 style={{ color: "#ea580c" }}>0%</h1>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "15px",
        }}
      >
        <a href="/organizations" style={button}>
          إضافة جمعية
        </a>

        <button style={button}>التقييم</button>

        <button style={button}>المنجزات</button>

        <button style={button}>المرفقات</button>

        <button style={button}>التقارير</button>
      </div>
    </main>
  );
}

const card = {
  background: "#fff",
  padding: "25px",
  borderRadius: "16px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
};

const button = {
  background: "#111827",
  color: "#fff",
  padding: "16px",
  borderRadius: "14px",
  border: "none",
  fontSize: "16px",
  cursor: "pointer",
  textAlign: "center" as const,
  textDecoration: "none",
};