import type { LucideIcon } from "lucide-react";

export function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: LucideIcon }) {
  return (
    <section className="card stat">
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
      <div className="stat-icon">
        <Icon size={24} />
      </div>
    </section>
  );
}
