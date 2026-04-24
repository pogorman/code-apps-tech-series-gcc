import { useState } from "react";
import { Calendar, Plus } from "lucide-react";
import type { Tdvsp_meetingsummariesModel } from "@/generated";
import { useCreateMeetingSummary } from "@/hooks/use-meeting-summaries";
import { toast } from "sonner";

interface MeetingsQuickAddProps {
  /** Optionally pre-bind new meetings to an account (e.g., the active filter). */
  defaultAccountId?: string | null;
}

/** Inline capture row sticky at the top of the table. Date defaults to today. */
export function MeetingsQuickAdd({ defaultAccountId }: MeetingsQuickAddProps) {
  const [text, setText] = useState("");
  const [date, setDate] = useState<string>(() => todayIso());
  const createMutation = useCreateMeetingSummary();

  function save() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const record: Record<string, unknown> = {
      tdvsp_name: trimmed.length > 120 ? trimmed.slice(0, 120) : trimmed,
      tdvsp_date: date || undefined,
    };
    if (defaultAccountId) {
      record["tdvsp_Account@odata.bind"] = `/accounts(${defaultAccountId})`;
    }

    createMutation.mutate(
      record as unknown as Omit<Tdvsp_meetingsummariesModel.Tdvsp_meetingsummariesBase, "tdvsp_meetingsummaryid">,
      {
        onSuccess: () => {
          toast.success("Meeting captured");
          setText("");
        },
        onError: (err) => toast.error(`Capture failed: ${err.message}`),
      },
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 sticky top-0 z-[3]"
      style={{
        background: "var(--dash-surface)",
        borderBottom: "1px solid var(--dash-border)",
        padding: "8px 14px",
      }}
    >
      <div
        className="grid place-items-center shrink-0"
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: "var(--dash-meet-soft)",
          color: "#0e7490",
          border: "1px dashed #a5f3fc",
        }}
      >
        <Plus className="h-[13px] w-[13px]" />
      </div>
      <input
        type="text"
        placeholder="Capture a meeting — title…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
        disabled={createMutation.isPending}
        className="flex-1 outline-none border-0 bg-transparent"
        style={{
          fontFamily: "inherit",
          fontSize: 13,
          color: "var(--dash-ink-1)",
          padding: "4px 0",
        }}
      />
      <div
        className="inline-flex items-center gap-1.5"
        style={{
          height: 24,
          padding: "0 8px",
          borderRadius: 6,
          background: "var(--dash-surface-2)",
          border: "1px solid var(--dash-border-strong)",
        }}
      >
        <Calendar className="h-[12px] w-[12px]" style={{ color: "var(--dash-ink-3)" }} />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="outline-none border-0 bg-transparent tabular-nums"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "var(--dash-ink-2)",
            width: 120,
          }}
        />
      </div>
      <span
        className="hidden sm:inline-flex items-center gap-1.5"
        style={{ fontSize: 11, color: "var(--dash-ink-4)" }}
      >
        <kbd
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            padding: "1px 5px",
            background: "var(--dash-surface-2)",
            border: "1px solid var(--dash-border-strong)",
            borderRadius: 3,
            color: "var(--dash-ink-3)",
          }}
        >
          ↵
        </kbd>
        save
      </span>
    </div>
  );
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
