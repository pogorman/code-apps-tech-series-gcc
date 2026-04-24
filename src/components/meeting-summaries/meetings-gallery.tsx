import { Pencil, Pin, Sparkles, Trash2 } from "lucide-react";
import type { Tdvsp_meetingsummariesModel } from "@/generated";
import type { MeetingGroup } from "./meetings-table";
import { AccountAvatar, DateTile } from "./meetings-table";
import { formatMonthDay, isDatePast, isPinned, relativeWhen } from "./labels";

type MeetingSummary = Tdvsp_meetingsummariesModel.Tdvsp_meetingsummaries;

interface MeetingsGalleryProps {
  groups: MeetingGroup[];
  onView: (item: MeetingSummary) => void;
  onEdit: (item: MeetingSummary) => void;
  onDelete: (item: MeetingSummary) => void;
  onSpawn: (item: MeetingSummary) => void;
  onAccountFilter: (accountId: string | null) => void;
}

export function MeetingsGallery({ groups, onView, onEdit, onDelete, onSpawn, onAccountFilter }: MeetingsGalleryProps) {
  if (groups.length === 0) {
    return (
      <div
        style={{
          padding: "60px 18px",
          textAlign: "center",
          color: "var(--dash-ink-4)",
          fontSize: 13,
        }}
      >
        No meetings to show.
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ padding: "14px 18px 80px", background: "var(--dash-bg)" }}>
      {groups.map((g) => (
        <div key={g.accountId ?? "__none__"} className="mb-6">
          <button
            type="button"
            onClick={() => onAccountFilter(g.accountId)}
            className="inline-flex items-center gap-2.5 mb-3 cursor-pointer"
            style={{
              background: "none",
              border: 0,
              padding: 0,
              textAlign: "left",
            }}
            title="Filter to this account"
          >
            <AccountAvatar name={g.accountName} size={22} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--dash-ink-1)", letterSpacing: "-0.005em" }}>
              {g.accountName}
            </span>
            <span
              className="tabular-nums"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                padding: "1px 7px",
                borderRadius: 10,
                background: "var(--dash-surface)",
                color: "var(--dash-ink-2)",
                border: "1px solid var(--dash-border-strong)",
                fontWeight: 600,
              }}
            >
              {g.items.length}
            </span>
          </button>

          <div
            className="grid gap-2.5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
          >
            {g.items.map((item) => (
              <MeetingCard
                key={item.tdvsp_meetingsummaryid}
                item={item}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onSpawn={onSpawn}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MeetingCard({
  item,
  onView,
  onEdit,
  onDelete,
  onSpawn,
}: {
  item: MeetingSummary;
  onView: (item: MeetingSummary) => void;
  onEdit: (item: MeetingSummary) => void;
  onDelete: (item: MeetingSummary) => void;
  onSpawn: (item: MeetingSummary) => void;
}) {
  const pinned = isPinned(item);
  const past = isDatePast(item.tdvsp_date);
  const { month, day } = formatMonthDay(item.tdvsp_date);
  const when = relativeWhen(item.tdvsp_date);

  return (
    <div
      onClick={() => onView(item)}
      className="group cursor-pointer"
      style={{
        padding: 12,
        borderRadius: 10,
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        boxShadow: "var(--dash-shadow-xs)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 160,
        transition: "all 0.12s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(-1px)";
        el.style.boxShadow = "var(--dash-shadow-sm)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "var(--dash-shadow-xs)";
      }}
    >
      {/* Head: date tile + name + hover actions */}
      <div className="flex items-start gap-2.5">
        <DateTile month={month} day={day} past={past} />
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {pinned && (
              <Pin className="h-[12px] w-[12px] shrink-0" style={{ color: "#0e7490", fill: "#0e7490" }} />
            )}
            <span
              className="truncate"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--dash-ink-1)",
                letterSpacing: "-0.005em",
              }}
            >
              {item.tdvsp_name}
            </span>
          </div>
          <span
            style={{
              fontSize: 11,
              color: when.isToday ? "var(--dash-teal)" : "var(--dash-ink-4)",
              fontWeight: when.isToday ? 600 : 500,
            }}
          >
            {when.label}
          </span>
        </div>
        <div
          className="inline-flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <CardIconBtn title="Spawn action items" onClick={() => onSpawn(item)} color="#0e7490">
            <Sparkles className="h-[12px] w-[12px]" />
          </CardIconBtn>
          <CardIconBtn title="Edit" onClick={() => onEdit(item)} color="var(--dash-ink-3)">
            <Pencil className="h-[12px] w-[12px]" />
          </CardIconBtn>
          <CardIconBtn title="Delete" onClick={() => onDelete(item)} color="#b91c1c">
            <Trash2 className="h-[12px] w-[12px]" />
          </CardIconBtn>
        </div>
      </div>

      {/* Summary */}
      {item.tdvsp_summary ? (
        <div
          style={{
            fontSize: 11.5,
            color: "var(--dash-ink-3)",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.tdvsp_summary}
        </div>
      ) : (
        <div
          style={{
            fontSize: 11.5,
            color: "var(--dash-ink-4)",
            fontStyle: "italic",
          }}
        >
          No summary captured yet.
        </div>
      )}
    </div>
  );
}

function CardIconBtn({
  children,
  title,
  onClick,
  color,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="cursor-pointer inline-flex items-center justify-center"
      style={{
        width: 24,
        height: 24,
        border: 0,
        borderRadius: 4,
        background: "transparent",
        color,
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--dash-surface-2)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      {children}
    </button>
  );
}
