import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Pin, Sparkles, Trash2 } from "lucide-react";
import type { Tdvsp_meetingsummariesModel } from "@/generated";
import { accountAvatarColor, formatMonthDay, isDatePast, isPinned, relativeWhen } from "./labels";

type MeetingSummary = Tdvsp_meetingsummariesModel.Tdvsp_meetingsummaries;

export interface MeetingGroup {
  accountId: string | null;
  accountName: string;
  items: MeetingSummary[];
}

interface MeetingsTableProps {
  groups: MeetingGroup[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
  onView: (item: MeetingSummary) => void;
  onEdit: (item: MeetingSummary) => void;
  onDelete: (item: MeetingSummary) => void;
  onSpawn: (item: MeetingSummary) => void;
  onAccountFilter: (accountId: string | null) => void;
  quickAdd: React.ReactNode;
}

export function MeetingsTable({
  groups,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  onView,
  onEdit,
  onDelete,
  onSpawn,
  onAccountFilter,
  quickAdd,
}: MeetingsTableProps) {
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
    <div className="overflow-auto" style={{ background: "var(--dash-bg)" }}>
      {quickAdd}
      <table
        className="w-full"
        style={{ borderCollapse: "separate", borderSpacing: 0, fontSize: 12.5 }}
      >
        <thead>
          <tr>
            <Th width={36} className="pl-[14px]">
              <Checkbox checked={allSelected} onChange={onToggleSelectAll} />
            </Th>
            <Th>Meeting</Th>
            <Th>Account</Th>
            <Th>When</Th>
            <Th width={80} align="right" />
          </tr>
        </thead>
        <tbody>
          {groups.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: "40px 18px", textAlign: "center" }}>
                <span style={{ color: "var(--dash-ink-4)", fontSize: 13 }}>
                  No meetings yet. Capture one from the header, or ⌘⇧M.
                </span>
              </td>
            </tr>
          ) : (
            groups.map((g) => {
              const key = g.accountId ?? "__none__";
              const isCollapsed = collapsed.has(key);
              return (
                <Fragment key={key}>
                  {/* Group header */}
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        background: "var(--dash-bg)",
                        padding: "16px 10px 6px",
                        borderBottom: "1px solid var(--dash-border)",
                      }}
                    >
                      <div className="inline-flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleGroup(key)}
                          className="cursor-pointer"
                          style={{ background: "none", border: 0, padding: 0, display: "inline-flex", alignItems: "center" }}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--dash-ink-4)" }} />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--dash-ink-4)" }} />
                          )}
                        </button>
                        <AccountAvatar name={g.accountName} size={22} />
                        <button
                          type="button"
                          onClick={() => onAccountFilter(g.accountId)}
                          className="cursor-pointer"
                          style={{
                            background: "none",
                            border: 0,
                            padding: 0,
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--dash-ink-1)",
                            letterSpacing: "-0.005em",
                          }}
                          title="Filter to this account"
                        >
                          {g.accountName}
                        </button>
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
                    </td>
                  </tr>

                  {!isCollapsed &&
                    g.items.map((item) => (
                      <MeetingRow
                        key={item.tdvsp_meetingsummaryid}
                        item={item}
                        selected={selectedIds.has(item.tdvsp_meetingsummaryid)}
                        onToggleSelect={onToggleSelect}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onSpawn={onSpawn}
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

/* ── Row ──────────────────────────────────────────────────── */

interface MeetingRowProps {
  item: MeetingSummary;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onView: (item: MeetingSummary) => void;
  onEdit: (item: MeetingSummary) => void;
  onDelete: (item: MeetingSummary) => void;
  onSpawn: (item: MeetingSummary) => void;
}

function MeetingRow({ item, selected, onToggleSelect, onView, onEdit, onDelete, onSpawn }: MeetingRowProps) {
  const raw = item as unknown as Record<string, unknown>;
  const accountId = (raw._tdvsp_account_value as string | undefined) ?? "";
  const accountName = item.tdvsp_accountname ?? "";
  const dateIso = item.tdvsp_date;
  const past = isDatePast(dateIso);
  const { month, day } = formatMonthDay(dateIso);
  const when = relativeWhen(dateIso);
  const pinned = isPinned(item);

  return (
    <tr
      onClick={() => onView(item)}
      className="group cursor-pointer"
      style={{
        background: selected ? "var(--dash-meet-soft)" : "var(--dash-surface)",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = "var(--dash-surface-2)";
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = "var(--dash-surface)";
      }}
    >
      {/* Checkbox */}
      <Td className="pl-[14px]" onClick={(e) => { e.stopPropagation(); onToggleSelect(item.tdvsp_meetingsummaryid); }}>
        <Checkbox checked={selected} onChange={() => onToggleSelect(item.tdvsp_meetingsummaryid)} />
      </Td>

      {/* Meeting (date tile + name + summary) */}
      <Td>
        <div className="flex items-stretch gap-2.5" style={{ minWidth: 360, maxWidth: 500 }}>
          <DateTile month={month} day={day} past={past} />
          <div className="flex flex-col justify-center gap-0.5" style={{ minWidth: 0, flex: 1 }}>
            <div className="flex items-center gap-2">
              {pinned && (
                <Pin
                  className="h-[12px] w-[12px] shrink-0"
                  style={{ color: "#0e7490", fill: "#0e7490" }}
                />
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
            {item.tdvsp_summary ? (
              <span
                className="truncate"
                style={{ fontSize: 11, color: "var(--dash-ink-3)", lineHeight: 1.4 }}
              >
                {firstSentence(item.tdvsp_summary)}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: "var(--dash-ink-4)", fontStyle: "italic" }}>
                No summary yet
              </span>
            )}
          </div>
        </div>
      </Td>

      {/* Account */}
      <Td>
        {accountName ? (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <AccountAvatar name={accountName} size={20} />
            <span style={{ fontSize: 12, color: "var(--dash-ink-2)" }}>{accountName}</span>
          </div>
        ) : accountId ? (
          <span style={{ fontSize: 12, color: "var(--dash-ink-4)" }}>…</span>
        ) : (
          <div className="flex items-center gap-1.5" style={{ color: "var(--dash-ink-4)" }}>
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                background: "var(--dash-surface-2)",
                border: "1px dashed var(--dash-border-strong)",
              }}
            />
            <span style={{ fontSize: 12, fontStyle: "italic" }}>No account</span>
          </div>
        )}
      </Td>

      {/* When */}
      <Td>
        <div className="flex flex-col">
          <span
            className="tabular-nums"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: "var(--dash-ink-2)",
              whiteSpace: "nowrap",
            }}
          >
            {dateIso ? new Date(dateIso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
          </span>
          {dateIso && (
            <span
              style={{
                fontSize: 10,
                color: when.isToday ? "var(--dash-teal)" : "var(--dash-ink-4)",
                fontWeight: when.isToday ? 600 : 500,
                marginTop: 1,
              }}
            >
              {when.label}
            </span>
          )}
        </div>
      </Td>

      {/* Actions (hover-reveal) */}
      <Td align="right" className="pr-[14px]">
        <div
          className="inline-flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <IconBtn title="Spawn action items" onClick={() => onSpawn(item)} color="#0e7490" hoverBg="var(--dash-meet-soft)">
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
        padding: "9px 10px",
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

export function DateTile({ month, day, past }: { month: string; day: string; past: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center shrink-0"
      style={{
        width: 42,
        height: 42,
        borderRadius: 7,
        background: past ? "var(--dash-surface-2)" : "var(--dash-meet-soft)",
        border: past ? "1px solid var(--dash-border-strong)" : "1px solid #a5f3fc",
        color: past ? "var(--dash-ink-3)" : "#0e7490",
      }}
    >
      <span
        style={{
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          lineHeight: 1,
          marginBottom: 2,
        }}
      >
        {month}
      </span>
      <span
        className="tabular-nums"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {day}
      </span>
    </div>
  );
}

export function AccountAvatar({ name, size = 20 }: { name: string; size?: number }) {
  const pick = accountAvatarColor(name);
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <span
      className="grid place-items-center shrink-0 tabular-nums"
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(4, Math.floor(size / 4)),
        fontSize: Math.max(9, Math.floor(size / 2.2)),
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
        height: 24,
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

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const m = trimmed.match(/^[^.!?]{4,160}[.!?]/);
  return m ? m[0] : trimmed.length > 140 ? trimmed.slice(0, 140) + "…" : trimmed;
}
