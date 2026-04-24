import { Calendar, Plus, Upload } from "lucide-react";
import type { Tdvsp_meetingsummariesModel } from "@/generated";

type MeetingSummary = Tdvsp_meetingsummariesModel.Tdvsp_meetingsummaries;

interface MeetingsHeaderProps {
  items: MeetingSummary[] | undefined;
  onNew: () => void;
  onUploadTranscript: () => void;
}

/**
 * Hero row + 4-card stats strip (incl. 8-week meeting-cadence sparkline).
 *
 * We compute stats client-side from the passed items.
 */
export function MeetingsHeader({ items, onNew, onUploadTranscript }: MeetingsHeaderProps) {
  const total = items?.length ?? 0;
  const now = new Date();
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  let thisWeek = 0;
  const accountSet = new Set<string>();
  for (const it of items ?? []) {
    const d = it.tdvsp_date;
    if (d && new Date(d).getTime() >= weekAgo) thisWeek++;
    const a = (it as unknown as Record<string, string>)._tdvsp_account_value;
    if (a) accountSet.add(a);
  }
  const accountCount = accountSet.size;

  // 8-week cadence: bucket by week, most recent on the right
  const weekCounts = new Array(8).fill(0) as number[];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (const it of items ?? []) {
    if (!it.tdvsp_date) continue;
    const d = new Date(it.tdvsp_date);
    const diffMs = today.getTime() - d.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    if (diffWeeks >= 0 && diffWeeks < 8) {
      // bucket 7 = this week, 0 = 7 weeks ago
      weekCounts[7 - diffWeeks] = (weekCounts[7 - diffWeeks] ?? 0) + 1;
    }
  }

  return (
    <div
      className="flex flex-col gap-3"
      style={{
        padding: "14px 18px 14px",
        background: "var(--dash-bg)",
        borderBottom: "1px solid var(--dash-border)",
      }}
    >
      {/* Hero row */}
      <div className="flex items-center gap-3">
        <div
          className="grid place-items-center"
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: "linear-gradient(135deg, #cffafe, #a5f3fc)",
            color: "#0e7490",
            border: "1px solid #a5f3fc",
          }}
        >
          <Calendar className="h-[19px] w-[19px]" />
        </div>
        <div className="flex flex-col">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.08em] leading-tight"
            style={{ color: "var(--dash-ink-4)" }}
          >
            Capture key meeting outcomes and notes
          </span>
          <h1
            className="text-[22px] font-bold tracking-[-0.02em] leading-tight m-0"
            style={{ color: "var(--dash-ink-1)" }}
          >
            Meeting Summaries
          </h1>
        </div>

        <div className="flex-1" />

        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={onUploadTranscript}
            className="inline-flex items-center gap-1.5 cursor-pointer text-[12px] font-medium"
            style={{
              fontFamily: "inherit",
              height: 32,
              padding: "0 12px",
              borderRadius: 7,
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border-strong)",
              color: "var(--dash-ink-2)",
            }}
          >
            <Upload className="h-[13px] w-[13px]" />
            Upload transcript
          </button>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold"
            style={{
              fontFamily: "inherit",
              height: 32,
              padding: "0 12px",
              borderRadius: 7,
              background: "linear-gradient(135deg, #06b6d4, #0e7490)",
              color: "#fff",
              border: "1px solid #0e7490",
              boxShadow: "0 1px 2px rgba(14,116,144,.3)",
            }}
          >
            <Plus className="h-[13px] w-[13px]" />
            New Summary
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: "1fr 1fr 1fr 2fr" }}
      >
        <StatCard label="Total summaries" value={total} sub={`Across ${accountCount} account${accountCount === 1 ? "" : "s"}`} />
        <StatCard
          label="This week"
          value={thisWeek}
          sub={thisWeek > 0 ? "Captured recently" : "None yet"}
        />
        <StatCard
          label="With summary"
          value={(items ?? []).filter((it) => (it.tdvsp_summary ?? "").trim().length > 0).length}
          sub="text present"
        />
        <SparkCard label="8w cadence" counts={weekCounts} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div
      className="flex flex-col gap-0.5"
      style={{
        padding: "10px 12px",
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 10,
        boxShadow: "var(--dash-shadow-xs)",
      }}
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: "var(--dash-ink-4)" }}
      >
        {label}
      </span>
      <span
        className="tabular-nums"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--dash-ink-1)",
        }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[11px]" style={{ color: "var(--dash-ink-3)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function SparkCard({ label, counts }: { label: string; counts: number[] }) {
  const max = Math.max(1, ...counts);
  // Build an SVG path from counts, scaled to viewBox 200x38 (y inverted — max at top)
  const step = counts.length > 1 ? 200 / (counts.length - 1) : 0;
  const points = counts.map((c, i) => {
    const x = i * step;
    const y = 32 - (c / max) * 26; // leave 6px top + 6px bottom padding
    return { x, y };
  });
  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const fillD = pathD + ` L${points[points.length - 1]!.x},38 L${points[0]!.x},38 Z`;
  const lastPt = points[points.length - 1]!;

  return (
    <div
      className="flex items-end gap-3"
      style={{
        padding: "10px 12px",
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        borderRadius: 10,
        boxShadow: "var(--dash-shadow-xs)",
      }}
    >
      <div className="flex flex-col gap-0.5">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--dash-ink-4)" }}
        >
          Per week
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--dash-ink-1)",
            letterSpacing: "-0.02em",
          }}
        >
          {label}
        </span>
      </div>
      <svg
        viewBox="0 0 200 38"
        preserveAspectRatio="none"
        style={{ flex: 1, height: 38, width: "100%" }}
      >
        <defs>
          <linearGradient id="meetSparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={pathD} fill="none" stroke="#0e7490" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <path d={fillD} fill="url(#meetSparkFill)" />
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isLast ? 2.5 : 1.5}
              fill={isLast ? "#06b6d4" : "#0e7490"}
              stroke={isLast ? "#fff" : undefined}
              strokeWidth={isLast ? 1.5 : undefined}
            />
          );
        })}
        {/* latest-point marker uses lastPt coords already drawn above */}
        <circle cx={lastPt.x} cy={lastPt.y} r={0} />
      </svg>
    </div>
  );
}
