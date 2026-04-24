import { useMemo } from "react";
import type { Tdvsp_meetingsummariesModel } from "@/generated";
import { AccountAvatar } from "./meetings-table";

type MeetingSummary = Tdvsp_meetingsummariesModel.Tdvsp_meetingsummaries;

interface MeetingsTimelineProps {
  items: MeetingSummary[];
  onView: (item: MeetingSummary) => void;
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** 7-day grid, Monday start, centered on "today". Past days muted; today highlighted. */
export function MeetingsTimeline({ items, onView }: MeetingsTimelineProps) {
  const { days, buckets } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Monday = 1, Sunday = 0 → shift so Monday is column 0
    const dayOfWeek = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);

    const days: Date[] = [];
    const buckets: Map<number, MeetingSummary[]> = new Map();
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
      buckets.set(d.getTime(), []);
    }

    for (const it of items) {
      if (!it.tdvsp_date) continue;
      const d = new Date(it.tdvsp_date);
      const dayKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const list = buckets.get(dayKey);
      if (list) list.push(it);
    }

    return { days, buckets };
  }, [items]);

  // Off-week list: meetings whose date isn't in the 7-day window but is within last 30 / next 30 days
  const offWeek = useMemo(() => {
    const weekKeys = new Set(days.map((d) => d.getTime()));
    const out: MeetingSummary[] = [];
    for (const it of items) {
      if (!it.tdvsp_date) continue;
      const d = new Date(it.tdvsp_date);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (!weekKeys.has(key)) out.push(it);
    }
    out.sort((a, b) => (b.tdvsp_date ?? "").localeCompare(a.tdvsp_date ?? ""));
    return out;
  }, [days, items]);

  const now = new Date();
  const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return (
    <div style={{ padding: "14px 18px 80px", background: "var(--dash-bg)", overflowX: "auto" }}>
      {/* Dow headers */}
      <div
        className="mb-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(180px, 1fr))",
          gap: 8,
          minWidth: 1300,
        }}
      >
        {days.map((d, i) => (
          <div
            key={d.getTime()}
            className="text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--dash-ink-4)", padding: "0 2px" }}
          >
            {DOW[i]} · {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(180px, 1fr))",
          gap: 8,
          minWidth: 1300,
        }}
      >
        {days.map((d) => {
          const isToday = d.getTime() === todayTime;
          const isPast = d.getTime() < todayTime;
          const list = buckets.get(d.getTime()) ?? [];
          return (
            <div
              key={d.getTime()}
              className="flex flex-col gap-2"
              style={{
                padding: 10,
                minHeight: 260,
                borderRadius: 10,
                background: "var(--dash-surface)",
                border: isToday ? "1px solid var(--dash-teal)" : "1px solid var(--dash-border)",
                boxShadow: isToday ? "0 0 0 2px var(--dash-meet-soft)" : "var(--dash-shadow-xs)",
              }}
            >
              <div
                className="flex items-baseline justify-between pb-2"
                style={{ borderBottom: "1px solid var(--dash-border)" }}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: "var(--dash-ink-4)" }}
                >
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 15,
                    fontWeight: 700,
                    color: isToday ? "var(--dash-teal)" : "var(--dash-ink-1)",
                  }}
                >
                  {d.getDate()}
                </span>
              </div>

              {list.length === 0 ? (
                <span
                  className="text-[11px] italic"
                  style={{ color: "var(--dash-ink-4)", textAlign: "center", padding: "12px 0" }}
                >
                  No meetings
                </span>
              ) : (
                list.map((item) => <TimelineEvent key={item.tdvsp_meetingsummaryid} item={item} past={isPast} onView={onView} />)
              )}
            </div>
          );
        })}
      </div>

      {/* Off-week list */}
      {offWeek.length > 0 && (
        <div className="mt-6">
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-2"
            style={{ color: "var(--dash-ink-4)", padding: "0 2px" }}
          >
            Other weeks · {offWeek.length}
          </div>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
          >
            {offWeek.map((item) => (
              <TimelineEvent key={item.tdvsp_meetingsummaryid} item={item} past onView={onView} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineEvent({
  item,
  past,
  onView,
}: {
  item: MeetingSummary;
  past: boolean;
  onView: (item: MeetingSummary) => void;
}) {
  const accountName = item.tdvsp_accountname ?? "";
  return (
    <button
      type="button"
      onClick={() => onView(item)}
      className="cursor-pointer text-left"
      style={{
        padding: "7px 9px",
        borderRadius: 7,
        background: past ? "var(--dash-surface-2)" : "var(--dash-meet-soft)",
        border: past ? "1px solid var(--dash-border-strong)" : "1px solid #a5f3fc",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = past ? "var(--dash-surface-3)" : "#a5f3fc";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = past ? "var(--dash-surface-2)" : "var(--dash-meet-soft)";
      }}
    >
      <span
        className="tabular-nums"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 600,
          color: past ? "var(--dash-ink-3)" : "#0e7490",
        }}
      >
        {item.tdvsp_date
          ? new Date(item.tdvsp_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
          : "—"}
      </span>
      <span
        className="truncate"
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: "var(--dash-ink-1)",
          lineHeight: 1.35,
        }}
      >
        {item.tdvsp_name}
      </span>
      {accountName && (
        <div className="flex items-center gap-1.5">
          <AccountAvatar name={accountName} size={14} />
          <span className="truncate" style={{ fontSize: 10, color: "var(--dash-ink-3)" }}>
            {accountName}
          </span>
        </div>
      )}
    </button>
  );
}
