import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Tdvsp_projectsModel } from "@/generated";
import { useAccounts } from "@/hooks/use-accounts";
import { Pencil } from "lucide-react";
import { PROJECT_PRIORITY_LABELS, projectPriorityVariant } from "./labels";

type Project = Tdvsp_projectsModel.Tdvsp_projects;

interface ProjectDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onEdit: (item: Project) => void;
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

export function ProjectDetailDialog({
  open,
  onOpenChange,
  project,
  onEdit,
}: ProjectDetailDialogProps) {
  const { data: accounts } = useAccounts();

  if (!project) return null;

  const accountId = (project as unknown as Record<string, string>)._tdvsp_account_value;
  const accountName = project.tdvsp_accountname
    ?? accounts?.find((a) => a.accountid === accountId)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>{project.tdvsp_name}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(project)}
            >
              <Pencil className="mr-2 h-3 w-3" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={project.statecode === 0 ? "default" : "secondary"}>
              {project.statecodename ?? "Active"}
            </Badge>
            {project.tdvsp_priority != null && (
              <Badge variant={projectPriorityVariant(project.tdvsp_priority)}>
                {PROJECT_PRIORITY_LABELS[project.tdvsp_priority]}
              </Badge>
            )}
          </div>

          <Separator />

          <dl>
            <DetailRow label="Account" value={accountName} />
            <DetailRow
              label="Priority"
              value={project.tdvsp_priority != null ? PROJECT_PRIORITY_LABELS[project.tdvsp_priority] : null}
            />
          </dl>

          {project.tdvsp_description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">
                  {project.tdvsp_description}
                </p>
              </div>
            </>
          )}

          <Separator />
          <dl>
            <DetailRow label="Owner" value={project.owneridname} />
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}
