import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./components/ToastProvider";

export const metadata: Metadata = {
  title: "نظام الحوكمة الذكي",
  description: "لوحة حوكمة ذكية لإدارة الجمعيات والمعايير والتقييمات"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
