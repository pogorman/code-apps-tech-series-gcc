import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import type { Tdvsp_ideasModel } from "@/generated";
import { CATEGORY_DOT, CATEGORY_SHORT_LABELS, IDEA_PRIORITY_PILL } from "./labels";

type Idea = Tdvsp_ideasModel.Tdvsp_ideas;

interface IdeasKanbanProps {
  items: Idea[];
  accountNameMap: Map<string, string>;
  onView: (item: Idea) => void;
}

/**
 * Kanban view — columns by priority (substitutes for the brief's stage status,
 * since we don't have a separate stage field on tdvsp_Idea).
 *
 * Drag-to-change is intentionally deferred for v1; click a card to open the detail dialog
 * and change priority from there.
 */

type Col = { key: string; label: string; priority: number | null };

const COLUMNS: Col[] = [
  { key: "top",  label: "Top Priority", priority: 468510002 },
  { key: "high", label: "High",         priority: 468510003 },
  { key: "low",  label: "Low",          priority: 468510000 },
  { key: "eh",   label: "Eh",           priority: 468510001 },
  { key: "none", label: "Unset",        priority: null },
];

export function IdeasKanban({ items, accountNameMap, onView }: IdeasKanbanProps) {
  const buckets = useMemo(() => {
    const map = new Map<string, Idea[]>();
    for (const col of COLUMNS) map.set(col.key, []);
    for (const it of items) {
      const p = (it as unknown as Record<string, unknown>).tdvsp_priority as number | undefined;
      const col = COLUMNS.find((c) => c.priority === (p ?? null)) ?? COLUMNS[COLUMNS.length - 1]!;
      map.get(col.key)!.push(it);
    }
    return map;
  }, [items]);

  return (
    <div
      className="flex gap-3 overflow-x-auto"
      style={{
        padding: "14px 18px 80px",
        background: "var(--dash-bg)",
        minHeight: "100%",
      }}
    >
      {COLUMNS.map((col) => {
        const colItems = buckets.get(col.key) ?? [];
        return (
          <div
            key={col.key}
            className="flex flex-col gap-2 shrink-0"
            style={{
              width: 280,
              background: "var(--dash-surface-2)",
              borderRadius: 10,
              padding: 10,
            }}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-0.5 pt-0.5">
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--dash-ink-2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {col.label}
              </span>
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  padding: "1px 7px",
                  borderRadius: 10,
                  background: "var(--dash-surface)",
                  color: "var(--dash-ink-3)",
                  border: "1px solid var(--dash-border-strong)",
                  fontWeight: 600,
                }}
              >
                {colItems.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
              {colItems.length === 0 ? (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--dash-ink-4)",
                    padding: "14px 6px",
                    fontStyle: "italic",
                    textAlign: "center",
                  }}
                >
                  No ideas
                </span>
              ) : (
                colItems.map((item) => (
                  <KanbanCard
                    key={item.tdvsp_ideaid}
                    item={item}
                    accountNameMap={accountNameMap}
                    onView={onView}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  item,
  accountNameMap,
  onView,
}: {
  item: Idea;
  accountNameMap: Map<string, string>;
  onView: (item: Idea) => void;
}) {
  const raw = item as unknown as Record<string, unknown>;
  const accountId = (raw._tdvsp_account_value as string | undefined) ?? "";
  const accountName = item.tdvsp_accountname ?? accountNameMap.get(accountId) ?? "";
  const category = item.tdvsp_category;
  const priority = raw.tdvsp_priority as number | undefined;

  return (
    <button
      type="button"
      onClick={() => onView(item)}
      className="cursor-pointer text-left"
      style={{
        padding: 10,
        borderRadius: 8,
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        boxShadow: "var(--dash-shadow-xs)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--dash-border-strong)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--dash-border)";
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="grid place-items-center shrink-0"
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            background: "var(--dash-idea-soft)",
            color: "#a16207",
          }}
        >
          <Lightbulb className="h-[10px] w-[10px]" />
        </div>
        <span
          className="flex-1"
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--dash-ink-1)",
            letterSpacing: "-0.005em",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.tdvsp_name}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {category != null && (
          <span
            className="inline-flex items-center gap-1"
            style={{
              fontSize: 10,
              fontWeight: 500,
              padding: "1px 6px",
              borderRadius: 4,
              background: "var(--dash-surface-2)",
              color: "var(--dash-ink-3)",
              border: "1px solid var(--dash-border)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: CATEGORY_DOT[category] }}
            />
            {CATEGORY_SHORT_LABELS[category]}
          </span>
        )}
        {priority != null && priority !== undefined && (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              padding: "1px 5px",
              borderRadius: 3,
              ...IDEA_PRIORITY_PILL[priority],
            }}
          >
            {priority === 468510002 ? "Top" : priority === 468510003 ? "High" : priority === 468510000 ? "Low" : "Eh"}
          </span>
        )}
        {accountName && (
          <span
            className="truncate"
            style={{
              fontSize: 10,
              color: "var(--dash-ink-4)",
              maxWidth: 120,
              marginLeft: "auto",
            }}
          >
            {accountName}
          </span>
        )}
      </div>
    </button>
  );
}
