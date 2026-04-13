import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Tdvsp_meetingsummariesModel } from "@/generated";
import { useAccounts } from "@/hooks/use-accounts";
import { useProjects } from "@/hooks/use-projects";
import { Pencil, Sparkles } from "lucide-react";
import { ExtractActionItemsDialog } from "./extract-action-items-dialog";

type MeetingSummary = Tdvsp_meetingsummariesModel.Tdvsp_meetingsummaries;

interface MeetingSummaryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingSummary?: MeetingSummary;
  onEdit: (item: MeetingSummary) => void;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

export function MeetingSummaryDetailDialog({
  open,
  onOpenChange,
  meetingSummary,
  onEdit,
}: MeetingSummaryDetailDialogProps) {
  const { data: accounts } = useAccounts();
  const { data: projectsList } = useProjects();
  const [extractOpen, setExtractOpen] = useState(false);

  if (!meetingSummary) return null;

  const accountId = (meetingSummary as unknown as Record<string, string>)._tdvsp_account_value;
  const accountName = meetingSummary.tdvsp_accountname
    ?? accounts?.find((a) => a.accountid === accountId)?.name;

  const projectId = (meetingSummary as unknown as Record<string, string>)._tdvsp_project_value;
  const projectName = (meetingSummary as unknown as Record<string, string>).tdvsp_projectname
    ?? projectsList?.find((p) => p.tdvsp_projectid === projectId)?.tdvsp_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>{meetingSummary.tdvsp_name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setExtractOpen(true)}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-sm"
              >
                <Sparkles className="mr-2 h-3 w-3" />
                Extract Action Items
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(meetingSummary)}
              >
                <Pencil className="mr-2 h-3 w-3" />
                Edit
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={meetingSummary.statecode === 0 ? "default" : "secondary"}>
              {meetingSummary.statecodename ?? "Active"}
            </Badge>
          </div>

          <Separator />

          <dl>
            <DetailRow label="Project" value={projectName} />
            <DetailRow label="Account" value={accountName} />
            <DetailRow
              label="Date"
              value={meetingSummary.tdvsp_date ? new Date(meetingSummary.tdvsp_date).toLocaleDateString() : null}
            />
          </dl>

          {meetingSummary.tdvsp_summary && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Summary</p>
                <p className="text-sm whitespace-pre-wrap">
                  {meetingSummary.tdvsp_summary}
                </p>
              </div>
            </>
          )}

          <Separator />
          <dl>
            <DetailRow label="Owner" value={meetingSummary.owneridname} />
          </dl>
        </div>
      </DialogContent>

      <ExtractActionItemsDialog
        open={extractOpen}
        onOpenChange={setExtractOpen}
        meetingSummary={meetingSummary}
      />
    </Dialog>
  );
}
