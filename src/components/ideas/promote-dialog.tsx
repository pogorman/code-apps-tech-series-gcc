import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info, Lightbulb, ClipboardList } from "lucide-react";
import type { Tdvsp_ideasModel, Tdvsp_actionitemsModel } from "@/generated";
import { useCreateActionItem } from "@/hooks/use-action-items";
import { useUpdateIdea } from "@/hooks/use-ideas";
import { toast } from "sonner";
import { CATEGORY_DOT, CATEGORY_LABELS, STATE_ARCHIVED } from "./labels";

type Idea = Tdvsp_ideasModel.Tdvsp_ideas;

interface PromoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideas: Idea[];
  onDone: () => void;
}

const TASK_TYPE_WORK = 468510001;
const STATUS_RECOGNIZED = 468510000;
const DEFAULT_PRIORITY = 468510001; // Med

export function PromoteDialog({ open, onOpenChange, ideas, onDone }: PromoteDialogProps) {
  const [archiveAfter, setArchiveAfter] = useState(true);
  const createMutation = useCreateActionItem();
  const updateIdea = useUpdateIdea();
  const [isPromoting, setIsPromoting] = useState(false);

  async function handlePromote() {
    setIsPromoting(true);
    let successes = 0;
    let failures = 0;

    for (const idea of ideas) {
      try {
        const record: Record<string, unknown> = {
          tdvsp_name: idea.tdvsp_name,
          tdvsp_description: idea.tdvsp_description ?? undefined,
          tdvsp_tasktype: TASK_TYPE_WORK,
          tdvsp_taskstatus: STATUS_RECOGNIZED,
          tdvsp_priority:
            (idea as unknown as Record<string, number>).tdvsp_priority ?? DEFAULT_PRIORITY,
        };
        const accountId = (idea as unknown as Record<string, string>)._tdvsp_account_value;
        if (accountId) {
          record["tdvsp_Customer@odata.bind"] = `/accounts(${accountId})`;
        }

        await createMutation.mutateAsync(
          record as unknown as Omit<Tdvsp_actionitemsModel.Tdvsp_actionitemsBase, "tdvsp_actionitemid">,
        );

        if (archiveAfter) {
          await updateIdea.mutateAsync({
            id: idea.tdvsp_ideaid,
            fields: { statecode: STATE_ARCHIVED } as never,
          });
        }

        successes++;
      } catch {
        failures++;
      }
    }

    setIsPromoting(false);
    if (successes > 0) {
      toast.success(
        `Promoted ${successes} idea${successes === 1 ? "" : "s"}` +
          (archiveAfter ? " — archived originals" : ""),
      );
    }
    if (failures > 0) {
      toast.error(`${failures} failed to promote`);
    }
    onDone();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" style={{ maxHeight: "85vh" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="grid place-items-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "linear-gradient(135deg, #fde047, #facc15)",
                color: "#713f12",
              }}
            >
              <Lightbulb className="h-[15px] w-[15px]" />
            </span>
            Promote {ideas.length} idea{ideas.length === 1 ? "" : "s"} → Action Items
          </DialogTitle>
        </DialogHeader>

        {/* Preview list */}
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "45vh" }}>
          {ideas.map((idea) => {
            const cat = idea.tdvsp_category;
            const accountName = idea.tdvsp_accountname;
            return (
              <div
                key={idea.tdvsp_ideaid}
                className="flex items-center gap-2.5"
                style={{
                  padding: "8px 10px",
                  background: "var(--dash-surface-2)",
                  border: "1px solid var(--dash-border)",
                  borderRadius: 8,
                }}
              >
                <Lightbulb className="h-[14px] w-[14px] shrink-0" style={{ color: "#a16207" }} />
                <div className="flex-1 min-w-0">
                  <div
                    className="truncate"
                    style={{ fontSize: 12.5, fontWeight: 600, color: "var(--dash-ink-1)" }}
                  >
                    {idea.tdvsp_name}
                  </div>
                  <div
                    className="flex items-center gap-2 truncate"
                    style={{ fontSize: 11, color: "var(--dash-ink-3)" }}
                  >
                    {cat != null && (
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_DOT[cat] }} />
                        {CATEGORY_LABELS[cat]}
                      </span>
                    )}
                    {accountName && <span>· {accountName}</span>}
                  </div>
                </div>
                <ArrowRight className="h-[14px] w-[14px] shrink-0" style={{ color: "var(--dash-ink-4)" }} />
                <div className="flex items-center gap-1.5 shrink-0">
                  <ClipboardList className="h-[14px] w-[14px]" style={{ color: "var(--dash-violet)" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--dash-ink-2)" }}>Work</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info + archive toggle */}
        <div
          className="flex items-start gap-2 text-[11.5px]"
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            background: "var(--dash-idea-soft)",
            border: "1px solid #fde68a",
            color: "#713f12",
          }}
        >
          <Info className="h-[14px] w-[14px] mt-[1px] shrink-0" />
          <div className="flex-1 leading-[1.55]">
            Each idea creates a new Work action item with status <b>Recognized</b> and priority copied
            from the idea. Account is carried over; description is copied verbatim.
            <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={archiveAfter}
                onChange={(e) => setArchiveAfter(e.target.checked)}
              />
              Archive idea after promoting
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPromoting}>
            Cancel
          </Button>
          <Button
            onClick={handlePromote}
            disabled={isPromoting}
            style={{
              background: "linear-gradient(135deg, #fde047, #facc15)",
              color: "#713f12",
              border: "1px solid #eab308",
            }}
          >
            {isPromoting ? "Promoting…" : `Promote ${ideas.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
