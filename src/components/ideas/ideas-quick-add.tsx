import { useState } from "react";
import { Plus } from "lucide-react";
import type { Tdvsp_ideasModel } from "@/generated";
import { useCreateIdea } from "@/hooks/use-ideas";
import { toast } from "sonner";

interface IdeasQuickAddProps {
  /** Currently-active category filter, if any — new items land in this category by default. */
  defaultCategory: Tdvsp_ideasModel.Tdvsp_ideastdvsp_category | null;
}

/** Inline "+" row sticky at the top of the table view. Single-input, enter-to-save. */
export function IdeasQuickAdd({ defaultCategory }: IdeasQuickAddProps) {
  const [text, setText] = useState("");
  const createMutation = useCreateIdea();

  function save() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const record: Record<string, unknown> = {
      tdvsp_name: trimmed.length > 100 ? trimmed.slice(0, 100) : trimmed,
      tdvsp_category: defaultCategory ?? 468510006, // fallback: AI General
    };
    createMutation.mutate(
      record as unknown as Omit<Tdvsp_ideasModel.Tdvsp_ideasBase, "tdvsp_ideaid">,
      {
        onSuccess: () => {
          toast.success("Captured");
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
          background: "var(--dash-idea-soft)",
          color: "#a16207",
          border: "1px dashed #fde68a",
        }}
      >
        <Plus className="h-[13px] w-[13px]" />
      </div>
      <input
        type="text"
        placeholder="Capture an idea inline…"
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
      <span
        className="hidden sm:inline-flex items-center gap-1.5"
        style={{
          fontSize: 11,
          color: "var(--dash-ink-4)",
        }}
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
