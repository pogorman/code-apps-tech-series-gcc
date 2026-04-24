import { Lightbulb, Pencil, Sparkles, Trash2 } from "lucide-react";
import type { Tdvsp_ideasModel } from "@/generated";
import type { IdeaGroup } from "./ideas-table";
import { CATEGORY_TINT, CATEGORY_LABELS, IDEA_PRIORITY_PILL, IDEA_PRIORITY_SHORT } from "./labels";

type Idea = Tdvsp_ideasModel.Tdvsp_ideas;

interface IdeasGalleryProps {
  groups: IdeaGroup[];
  accountNameMap: Map<string, string>;
  onView: (item: Idea) => void;
  onEdit: (item: Idea) => void;
  onDelete: (item: Idea) => void;
  onPromote: (item: Idea) => void;
}

export function IdeasGallery({ groups, accountNameMap, onView, onEdit, onDelete, onPromote }: IdeasGalleryProps) {
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
        No ideas to show. Capture one below or press ⌘⇧I.
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ padding: "14px 18px 80px", background: "var(--dash-bg)" }}>
      {groups.map((g) => {
        const tint = g.category !== null ? CATEGORY_TINT[g.category] : null;
        return (
          <div key={g.category === null ? "__none__" : String(g.category)} className="mb-7">
            {/* Group header */}
            <div className="flex items-center gap-2.5 mb-3">
              {tint ? (
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: tint.bg,
                    color: tint.color,
                    border: `1px solid ${tint.border}`,
                  }}
                >
                  {g.category !== null ? CATEGORY_LABELS[g.category] : "Uncategorized"}
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: "var(--dash-t-slate)",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  Uncategorized
                </span>
              )}
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
            </div>

            {/* Card grid */}
            <div
              className="grid gap-2.5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              }}
            >
              {g.items.map((item) => (
                <IdeaCard
                  key={item.tdvsp_ideaid}
                  item={item}
                  accountNameMap={accountNameMap}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onPromote={onPromote}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IdeaCard({
  item,
  accountNameMap,
  onView,
  onEdit,
  onDelete,
  onPromote,
}: {
  item: Idea;
  accountNameMap: Map<string, string>;
  onView: (item: Idea) => void;
  onEdit: (item: Idea) => void;
  onDelete: (item: Idea) => void;
  onPromote: (item: Idea) => void;
}) {
  const raw = item as unknown as Record<string, unknown>;
  const accountId = (raw._tdvsp_account_value as string | undefined) ?? "";
  const accountName = item.tdvsp_accountname ?? accountNameMap.get(accountId) ?? "";
  const priority = raw.tdvsp_priority as number | undefined;
  const createdOn = raw.createdon as string | undefined;

  return (
    <div
      onClick={() => onView(item)}
      className="group cursor-pointer"
      style={{
        borderRadius: 10,
        padding: 12,
        minHeight: 130,
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        boxShadow: "var(--dash-shadow-xs)",
        transition: "all 0.12s",
        display: "flex",
        flexDirection: "column",
        gap: 8,
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
      {/* Header row: bulb + name + hover actions */}
      <div className="flex items-start gap-2">
        <div
          className="grid place-items-center shrink-0"
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: "var(--dash-idea-soft)",
            color: "#a16207",
          }}
        >
          <Lightbulb className="h-[12px] w-[12px]" />
        </div>
        <div
          className="flex-1"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--dash-ink-1)",
            letterSpacing: "-0.005em",
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.tdvsp_name}
        </div>
        <div
          className="inline-flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <CardIconBtn title="Promote" onClick={() => onPromote(item)} color="#a16207">
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

      {/* Description (2-line clamp) */}
      {item.tdvsp_description ? (
        <div
          style={{
            fontSize: 12,
            color: "var(--dash-ink-3)",
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.tdvsp_description}
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {/* Foot row: account · priority · age */}
      <div className="flex items-center gap-2 mt-auto">
        {accountName && (
          <span
            className="truncate"
            style={{
              fontSize: 11,
              color: "var(--dash-ink-3)",
              maxWidth: 140,
            }}
          >
            {accountName}
          </span>
        )}
        {priority != null && (
          <span
            className="inline-flex items-center gap-1"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              padding: "2px 7px",
              borderRadius: 4,
              whiteSpace: "nowrap",
              ...IDEA_PRIORITY_PILL[priority],
            }}
          >
            {IDEA_PRIORITY_SHORT[priority]}
          </span>
        )}
        <div className="flex-1" />
        <span
          className="tabular-nums"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: "var(--dash-ink-4)",
            whiteSpace: "nowrap",
          }}
        >
          {relativeAge(createdOn)}
        </span>
      </div>
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
        width: 22,
        height: 22,
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

function relativeAge(iso: string | undefined): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}
