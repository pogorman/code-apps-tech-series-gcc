import { ArrowRight } from "lucide-react";
import { PRIORITY_LABELS } from "@/components/action-items/labels";
import type { ActionItem } from "./dashboard-tokens";

interface FocusStripProps {
  items: ActionItem[];
  onItemClick: (item: ActionItem) => void;
}

export function FocusStrip({ items, onItemClick }: FocusStripProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const urgent = items
    .filter((i) => {
      if (i.tdvsp_taskstatus === 468510005) return false; // exclude complete
      const isHighPrio =
        i.tdvsp_priority === 468510002 || i.tdvsp_priority === 468510003;
      const isDueSoon =
        i.tdvsp_date ? new Date(i.tdvsp_date) <= tomorrow : false;
      return isHighPrio || isDueSoon;
    })
    .sort((a, b) => {
      const pa = a.tdvsp_priority ?? 0;
      const pb = b.tdvsp_priority ?? 0;
      if (pb !== pa) return pb - pa;
      const da = a.tdvsp_date ? new Date(a.tdvsp_date).getTime() : Infinity;
      const db = b.tdvsp_date ? new Date(b.tdvsp_date).getTime() : Infinity;
      return da - db;
    })
    .slice(0, 3);

  if (urgent.length === 0) return null;

  return (
    <div
      className="grid gap-3.5 items-stretch rounded-[10px] p-3.5 px-4 mb-3.5 relative overflow-hidden"
      style={{
        gridTemplateColumns: "auto 1fr auto",
        background: "linear-gradient(135deg, #1a1a22 0%, #2a1f3d 100%)",
        color: "#fff",
        boxShadow: "var(--dash-shadow-sm)",
      }}
    >
      {/* Decorative radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: -40,
          top: -40,
          width: 160,
          height: 160,
          background:
            "radial-gradient(circle, rgba(236,72,153,.25), transparent 70%)",
        }}
      />

      {/* Left label */}
      <div
        className="flex flex-col justify-center gap-1 pr-4 min-w-[140px]"
        style={{ borderRight: "1px solid rgba(255,255,255,.12)" }}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-pink-300">
          <span
            className="w-1.5 h-1.5 rounded-full bg-pink-400"
            style={{ animation: "dash-pulse 2s infinite" }}
          />
          Focus for today
        </div>
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] m-0">
          {urgent.length} item{urgent.length !== 1 ? "s" : ""} need you
        </h2>
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,.55)" }}>
          Based on priority &amp; due date
        </span>
      </div>

      {/* Items */}
      <div className="flex gap-2.5 items-center flex-wrap">
        {urgent.map((item) => {
          const prioClass =
            item.tdvsp_priority === 468510002
              ? "var(--dash-red)"
              : item.tdvsp_priority === 468510003
                ? "var(--dash-amber)"
                : "var(--dash-slate)";
          const prioLabel = item.tdvsp_priority != null
            ? PRIORITY_LABELS[item.tdvsp_priority] ?? ""
            : "";
          const dueStr = item.tdvsp_date ? formatDue(item.tdvsp_date) : "";

          return (
            <div
              key={item.tdvsp_actionitemid}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg flex-1 min-w-0 cursor-pointer"
              style={{
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.08)",
              }}
              onClick={() => onItemClick(item)}
            >
              <div
                className="w-1 self-stretch rounded-sm shrink-0"
                style={{ background: prioClass }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-white truncate">
                  {item.tdvsp_name}
                </div>
                <div
                  className="text-[11px] flex gap-2 items-center mt-0.5"
                  style={{ color: "rgba(255,255,255,.55)" }}
                >
                  {dueStr && <span>{dueStr}</span>}
                  {dueStr && prioLabel && <span>·</span>}
                  {prioLabel && <span>{prioLabel}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex items-center pl-1.5">
        <button
          className="inline-flex items-center gap-1.5 bg-white text-[#1a1a22] border-0 rounded-md h-8 px-3.5 text-xs font-semibold cursor-pointer"
          style={{ fontFamily: "inherit" }}
        >
          Start focus session
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function formatDue(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
