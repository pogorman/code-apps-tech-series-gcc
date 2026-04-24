import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Lightbulb, Pencil, Sparkles, Trash2 } from "lucide-react";
import type { Tdvsp_ideasModel } from "@/generated";
import { CATEGORY_TINT, CATEGORY_LABELS, IDEA_PRIORITY_PILL, IDEA_PRIORITY_SHORT } from "./labels";

type Idea = Tdvsp_ideasModel.Tdvsp_ideas;
type Category = Tdvsp_ideasModel.Tdvsp_ideastdvsp_category;

export interface IdeaGroup {
  category: Category | null; // null bucket = uncategorized
  items: Idea[];
}

interface IdeasTableProps {
  groups: IdeaGroup[];
  accountNameMap: Map<string, string>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
  onView: (item: Idea) => void;
  onEdit: (item: Idea) => void;
  onDelete: (item: Idea) => void;
  onPromote: (item: Idea) => void;
  quickAdd: React.ReactNode;
}

export function IdeasTable({
  groups,
  accountNameMap,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  onView,
  onEdit,
  onDelete,
  onPromote,
  quickAdd,
}: IdeasTableProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleGroup(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div
      className="overflow-auto"
      style={{
        background: "var(--dash-bg)",
      }}
    >
      {quickAdd}
      <table
        className="w-full"
        style={{
          borderCollapse: "separate",
          borderSpacing: 0,
          fontSize: 12.5,
        }}
      >
        <thead>
          <tr>
            <Th width={36} className="pl-[14px]">
              <Checkbox checked={allSelected} onChange={onToggleSelectAll} />
            </Th>
            <Th>Idea</Th>
            <Th>Account</Th>
            <Th>Priority</Th>
            <Th>Captured</Th>
            <Th width={76} align="right" />
          </tr>
        </thead>
        <tbody>
          {groups.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: "40px 18px", textAlign: "center" }}>
                <span style={{ color: "var(--dash-ink-4)", fontSize: 13 }}>
                  No ideas yet. Capture one below, or press ⌘⇧I.
                </span>
              </td>
            </tr>
          ) : (
            groups.map((g) => {
              const groupKey = g.category === null ? "__none__" : String(g.category);
              const isCollapsed = collapsed.has(groupKey);
              const tint = g.category !== null ? CATEGORY_TINT[g.category] : null;
              return (
                <Fragment key={groupKey}>
                  {/* Group header */}
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        background: "var(--dash-bg)",
                        padding: "18px 10px 6px",
                        borderBottom: "1px solid var(--dash-border)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupKey)}
                        className="inline-flex items-center gap-2.5 cursor-pointer"
                        style={{
                          background: "none",
                          border: 0,
                          padding: 0,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--dash-ink-2)",
                        }}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--dash-ink-4)" }} />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--dash-ink-4)" }} />
                        )}
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
                          <span style={{ color: "var(--dash-ink-3)" }}>Uncategorized</span>
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
                      </button>
                    </td>
                  </tr>

                  {/* Rows */}
                  {!isCollapsed &&
                    g.items.map((item) => (
                      <IdeaRow
                        key={item.tdvsp_ideaid}
                        item={item}
                        accountNameMap={accountNameMap}
                        selected={selectedIds.has(item.tdvsp_ideaid)}
                        onToggleSelect={onToggleSelect}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onPromote={onPromote}
                      />
                    ))}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ── Row ──────────────────────────────────────────────────────── */

interface IdeaRowProps {
  item: Idea;
  accountNameMap: Map<string, string>;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onView: (item: Idea) => void;
  onEdit: (item: Idea) => void;
  onDelete: (item: Idea) => void;
  onPromote: (item: Idea) => void;
}

function IdeaRow({
  item,
  accountNameMap,
  selected,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onPromote,
}: IdeaRowProps) {
  const raw = item as unknown as Record<string, unknown>;
  const accountId = (raw._tdvsp_account_value as string | undefined) ?? "";
  const accountName = item.tdvsp_accountname ?? accountNameMap.get(accountId) ?? "";
  const priority = raw.tdvsp_priority as number | undefined;
  const createdOn = raw.createdon as string | undefined;

  return (
    <tr
      onClick={() => onView(item)}
      className="group cursor-pointer"
      style={{
        background: selected ? "var(--dash-idea-soft)" : "var(--dash-surface)",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = "var(--dash-surface-2)";
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = "var(--dash-surface)";
      }}
    >
      {/* Check */}
      <Td className="pl-[14px]" onClick={(e) => { e.stopPropagation(); onToggleSelect(item.tdvsp_ideaid); }}>
        <Checkbox checked={selected} onChange={() => onToggleSelect(item.tdvsp_ideaid)} />
      </Td>

      {/* Idea */}
      <Td>
        <div className="flex items-center gap-2.5" style={{ minWidth: 320, maxWidth: 460 }}>
          <div
            className="grid place-items-center shrink-0"
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: "var(--dash-idea-soft)",
              color: "#a16207",
            }}
          >
            <Lightbulb className="h-[11px] w-[11px]" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              className="truncate"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--dash-ink-1)",
                letterSpacing: "-0.005em",
              }}
            >
              {item.tdvsp_name}
            </div>
            {item.tdvsp_description && (
              <div
                className="truncate"
                style={{
                  marginTop: 1,
                  fontSize: 11,
                  color: "var(--dash-ink-3)",
                }}
              >
                {item.tdvsp_description}
              </div>
            )}
          </div>
        </div>
      </Td>

      {/* Account */}
      <Td>
        {accountName ? (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <AccountAvatar name={accountName} />
            <span style={{ fontSize: 12, color: "var(--dash-ink-2)" }}>{accountName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5" style={{ color: "var(--dash-ink-4)" }}>
            <span
              className="grid place-items-center"
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: "var(--dash-surface-2)",
                border: "1px dashed var(--dash-border-strong)",
              }}
            />
            <span style={{ fontSize: 12, fontStyle: "italic" }}>No account</span>
          </div>
        )}
      </Td>

      {/* Priority */}
      <Td>
        {priority != null && IDEA_PRIORITY_PILL[priority] ? (
          <Pill
            label={IDEA_PRIORITY_SHORT[priority] ?? "—"}
            bg={IDEA_PRIORITY_PILL[priority]!.bg}
            color={IDEA_PRIORITY_PILL[priority]!.color}
          />
        ) : (
          <span style={{ color: "var(--dash-ink-4)" }}>—</span>
        )}
      </Td>

      {/* Captured */}
      <Td>
        <span
          className="tabular-nums"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "var(--dash-ink-3)",
            whiteSpace: "nowrap",
          }}
        >
          {relativeAge(createdOn)}
        </span>
      </Td>

      {/* Actions */}
      <Td align="right" className="pr-[14px]">
        <div
          className="inline-flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <IconBtn title="Promote to action item" onClick={() => onPromote(item)} color="#a16207" hoverBg="var(--dash-idea-soft)">
            <Sparkles className="h-[13px] w-[13px]" />
          </IconBtn>
          <IconBtn title="Edit" onClick={() => onEdit(item)} color="var(--dash-ink-2)" hoverBg="var(--dash-surface-2)">
            <Pencil className="h-[13px] w-[13px]" />
          </IconBtn>
          <IconBtn title="Delete" onClick={() => onDelete(item)} color="#b91c1c" hoverBg="var(--dash-t-red)">
            <Trash2 className="h-[13px] w-[13px]" />
          </IconBtn>
        </div>
      </Td>
    </tr>
  );
}

/* ── Helpers / small UI ──────────────────────────────────────── */

function Th({
  children,
  width,
  align,
  className,
}: {
  children?: React.ReactNode;
  width?: number;
  align?: "right";
  className?: string;
}) {
  return (
    <th
      className={className}
      style={{
        position: "sticky",
        top: 0,
        background: "var(--dash-bg)",
        zIndex: 2,
        textAlign: align ?? "left",
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--dash-ink-4)",
        padding: "10px 10px",
        borderBottom: "1px solid var(--dash-border)",
        whiteSpace: "nowrap",
        width,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  className,
  onClick,
}: {
  children?: React.ReactNode;
  align?: "right";
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <td
      onClick={onClick}
      className={className}
      style={{
        padding: "6px 10px",
        borderBottom: "1px solid var(--dash-border)",
        verticalAlign: "middle",
        textAlign: align,
      }}
    >
      {children}
    </td>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="cursor-pointer grid place-items-center"
      style={{
        width: 15,
        height: 15,
        border: checked ? "1.5px solid var(--dash-ink-1)" : "1.5px solid var(--dash-border-strong)",
        borderRadius: 3,
        background: checked ? "var(--dash-ink-1)" : "var(--dash-surface)",
        padding: 0,
      }}
    >
      {checked && (
        <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
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
        background: bg,
        color,
      }}
    >
      {label}
    </span>
  );
}

const AVATAR_COLORS = [
  { bg: "var(--dash-t-blue)", color: "var(--dash-blue)" },
  { bg: "var(--dash-t-green)", color: "var(--dash-green)" },
  { bg: "var(--dash-t-amber)", color: "var(--dash-amber)" },
  { bg: "var(--dash-t-violet)", color: "var(--dash-violet)" },
  { bg: "var(--dash-t-pink)", color: "var(--dash-pink)" },
  { bg: "var(--dash-t-cyan)", color: "var(--dash-cyan)" },
];

function AccountAvatar({ name }: { name: string }) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  const pick = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <span
      className="grid place-items-center shrink-0 tabular-nums"
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        fontSize: 8.5,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        background: pick.bg,
        color: pick.color,
      }}
    >
      {initials}
    </span>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  color,
  hoverBg,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  color: string;
  hoverBg: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="cursor-pointer inline-flex items-center justify-center"
      style={{
        height: 22,
        padding: "0 6px",
        border: 0,
        borderRadius: 4,
        background: "transparent",
        color,
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = hoverBg)}
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
