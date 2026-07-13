import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5 p-5 ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const STAT_ACCENTS: Record<string, string> = {
  teal: "bg-teal-50 text-teal-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  slate: "bg-slate-50 text-slate-500",
  indigo: "bg-indigo-50 text-indigo-600",
  violet: "bg-violet-50 text-violet-600",
  fuchsia: "bg-fuchsia-50 text-fuchsia-600",
  rose: "bg-rose-50 text-rose-600",
  cyan: "bg-cyan-50 text-cyan-600",
  orange: "bg-orange-50 text-orange-600",
};

export function StatCard({
  icon,
  label,
  value,
  tone = "slate",
  valueClassName = "",
}: {
  icon: string;
  label: string;
  value: string;
  tone?: "teal" | "amber" | "emerald" | "slate" | "indigo" | "violet" | "fuchsia" | "rose" | "cyan" | "orange";
  valueClassName?: string;
}) {
  return (
    <Card className="flex items-start gap-3">
      <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${STAT_ACCENTS[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-0.5 truncate">{label}</p>
        <p className={`text-xl font-extrabold text-slate-900 truncate ${valueClassName}`}>{value}</p>
      </div>
    </Card>
  );
}

const BADGE_TONES: Record<string, string> = {
  slate: "bg-slate-100 text-slate-600",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  teal: "bg-teal-100 text-teal-700",
  sky: "bg-sky-100 text-sky-700",
  blue: "bg-blue-100 text-blue-700",
  indigo: "bg-indigo-100 text-indigo-700",
  violet: "bg-violet-100 text-violet-700",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700",
  rose: "bg-rose-100 text-rose-700",
  cyan: "bg-cyan-100 text-cyan-700",
  orange: "bg-orange-100 text-orange-700",
};

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "emerald" | "amber" | "red" | "teal" | "sky" | "blue" | "indigo" | "violet" | "fuchsia" | "rose" | "cyan" | "orange";
}) {
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${BADGE_TONES[tone]}`}>{children}</span>
  );
}

export function EmptyState({
  icon = "📭",
  title,
  description,
}: {
  icon?: string;
  title: string;
  description?: string;
}) {
  return (
    <Card className="text-center py-16">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="font-semibold text-slate-600">{title}</p>
      {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
    </Card>
  );
}
