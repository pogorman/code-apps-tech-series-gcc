import {
  LayoutDashboard,
  Filter,
  Download,
  Plus,
} from "lucide-react";

export function PageHeader() {
  return (
    <div className="flex items-end justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <div
          className="w-[30px] h-[30px] rounded-[7px] grid place-items-center"
          style={{ background: "var(--dash-t-violet)", color: "var(--dash-violet)" }}
        >
          <LayoutDashboard className="h-4 w-4" />
        </div>
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--dash-ink-4)" }}
          >
            Insights at a glance
          </p>
          <h1
            className="text-xl font-bold tracking-[-0.02em] leading-tight"
            style={{ color: "var(--dash-ink-1)" }}
          >
            Action Items
          </h1>
        </div>
      </div>

      <div className="flex gap-1.5 items-center">
        {/* Segmented control (visual only) */}
        <div
          className="inline-flex h-7 rounded-md p-0.5"
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border-strong)",
          }}
        >
          {["7D", "30D", "90D", "All"].map((label) => (
            <button
              key={label}
              className="h-[22px] px-2.5 rounded text-[11px] font-medium border-0 cursor-pointer"
              style={{
                fontFamily: "inherit",
                background: label === "30D" ? "var(--dash-ink-1)" : "transparent",
                color: label === "30D" ? "#fff" : "var(--dash-ink-3)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <DashBtn icon={<Filter className="h-3.5 w-3.5" />} label="Filters" />
        <DashBtn icon={<Download className="h-3.5 w-3.5" />} label="Export" />
        <DashBtn
          icon={<Plus className="h-3.5 w-3.5" />}
          label="New Item"
          primary
        />
      </div>
    </div>
  );
}

function DashBtn({
  icon,
  label,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium cursor-pointer border"
      style={{
        fontFamily: "inherit",
        background: primary ? "var(--dash-ink-1)" : "var(--dash-surface)",
        color: primary ? "#fff" : "var(--dash-ink-2)",
        borderColor: primary ? "var(--dash-ink-1)" : "var(--dash-border-strong)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
