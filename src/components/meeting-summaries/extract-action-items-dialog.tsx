import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import type { Tdvsp_meetingsummariesModel } from "@/generated";
import {
  extractActionItems,
  isAoaiConfigured,
  mapPriorityToDataverse,
  DEFAULT_STATUS,
} from "@/lib/azure-openai";
import type { ExtractedActionItem } from "@/lib/azure-openai";
import { useCreateActionItem } from "@/hooks/use-action-items";

type MeetingSummary = Tdvsp_meetingsummariesModel.Tdvsp_meetingsummaries;

interface ExtractActionItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingSummary: MeetingSummary;
}

type Phase = "idle" | "extracting" | "preview" | "creating" | "done";

export function ExtractActionItemsDialog({
  open,
  onOpenChange,
  meetingSummary,
}: ExtractActionItemsDialogProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [items, setItems] = useState<ExtractedActionItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [createdCount, setCreatedCount] = useState(0);
  const createMutation = useCreateActionItem();

  const accountId = (meetingSummary as unknown as Record<string, string>)
    ._tdvsp_account_value;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setPhase("idle");
        setItems([]);
        setSelected(new Set());
        setCreatedCount(0);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const handleExtract = useCallback(async () => {
    if (!isAoaiConfigured()) {
      toast.error("Azure OpenAI not configured — set VITE_AOAI_* env vars");
      return;
    }

    const notes = meetingSummary.tdvsp_summary;
    if (!notes?.trim()) {
      toast.error("Meeting summary has no content to analyze");
      return;
    }

    setPhase("extracting");
    try {
      const extracted = await extractActionItems(notes);
      setItems(extracted);
      setSelected(new Set(extracted.map((_, i) => i)));
      setPhase("preview");
    } catch (err) {
      toast.error(`Extraction failed: ${err instanceof Error ? err.message : String(err)}`);
      setPhase("idle");
    }
  }, [meetingSummary]);

  const toggleItem = useCallback((index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleCreate = useCallback(async () => {
    const toCreate = items.filter((_, i) => selected.has(i));
    if (toCreate.length === 0) {
      toast.error("Select at least one action item");
      return;
    }

    setPhase("creating");
    let successCount = 0;

    for (const item of toCreate) {
      const record: Record<string, unknown> = {
        tdvsp_name: item.name,
        tdvsp_description: item.notes || undefined,
        tdvsp_priority: mapPriorityToDataverse(item.priority),
        tdvsp_taskstatus: DEFAULT_STATUS,
        tdvsp_duedate: item.dueDate || undefined,
        tdvsp_tasktype: 468510001, // Work
      };

      if (accountId) {
        record["tdvsp_Customer@odata.bind"] = `/accounts(${accountId})`;
      }

      try {
        await createMutation.mutateAsync(record as never);
        successCount++;
      } catch (err) {
        toast.error(`Failed to create "${item.name}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    setCreatedCount(successCount);
    setPhase("done");
    toast.success(`Created ${successCount} action item${successCount !== 1 ? "s" : ""} from meeting notes`);
  }, [items, selected, accountId, createMutation]);

  const selectedCount = items.filter((_, i) => selected.has(i)).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Extract Action Items with AI
          </DialogTitle>
        </DialogHeader>

        {/* Extracting state */}
        {phase === "extracting" && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-violet-400/30" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                <Sparkles className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-medium">Analyzing meeting notes...</p>
              <p className="text-sm text-muted-foreground">
                Extracting action items with Azure OpenAI
              </p>
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
          </div>
        )}

        {/* Preview state */}
        {phase === "preview" && items.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found <span className="font-semibold text-foreground">{items.length}</span> action item{items.length !== 1 ? "s" : ""}. Deselect any you don't want to create.
            </p>
            <div className="max-h-[50vh] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Action Item</TableHead>
                    <TableHead className="w-24">Priority</TableHead>
                    <TableHead className="w-28">Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={i} className="cursor-pointer" onClick={() => toggleItem(i)}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(i)}
                          onCheckedChange={() => toggleItem(i)}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {item.notes}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.priority === "High"
                              ? "destructive"
                              : item.priority === "Low"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {item.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.dueDate
                          ? new Date(item.dueDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Preview state — no items */}
        {phase === "preview" && items.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No action items found in the meeting notes.</p>
          </div>
        )}

        {/* Creating state */}
        {phase === "creating" && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <p className="font-medium">Creating action items in Dataverse...</p>
          </div>
        )}

        {/* Done state */}
        {phase === "done" && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="font-medium">
              Created {createdCount} action item{createdCount !== 1 ? "s" : ""}!
            </p>
            <p className="text-sm text-muted-foreground">
              They're now in your Action Items list and linked to this account.
            </p>
          </div>
        )}

        {/* Footer buttons */}
        <DialogFooter>
          {phase === "idle" && (
            <Button onClick={handleExtract} className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md">
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Meeting Notes
            </Button>
          )}
          {phase === "preview" && items.length > 0 && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={selectedCount === 0}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
              >
                Create {selectedCount} Action Item{selectedCount !== 1 ? "s" : ""}
              </Button>
            </>
          )}
          {(phase === "done" || (phase === "preview" && items.length === 0)) && (
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
