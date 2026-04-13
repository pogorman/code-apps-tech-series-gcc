import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Tdvsp_actionitemsModel } from "@/generated";
import { useAccounts } from "@/hooks/use-accounts";
import { Pencil } from "lucide-react";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_TYPE_LABELS,
  priorityVariant,
  statusVariant,
} from "./labels";

type ActionItem = Tdvsp_actionitemsModel.Tdvsp_actionitems;

interface ActionItemDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionItem?: ActionItem;
  onEdit: (item: ActionItem) => void;
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

export function ActionItemDetailDialog({
  open,
  onOpenChange,
  actionItem,
  onEdit,
}: ActionItemDetailDialogProps) {
  const { data: accounts } = useAccounts();

  if (!actionItem) return null;

  const customerId = (actionItem as unknown as Record<string, string>)._tdvsp_customer_value;
  const customerName = actionItem.tdvsp_customername
    ?? accounts?.find((a) => a.accountid === customerId)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>{actionItem.tdvsp_name}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(actionItem)}
            >
              <Pencil className="mr-2 h-3 w-3" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={actionItem.statecode === 0 ? "default" : "secondary"}>
              {actionItem.statecodename ?? "Active"}
            </Badge>
            {actionItem.tdvsp_priority != null && (
              <Badge variant={priorityVariant(actionItem.tdvsp_priority)}>
                {PRIORITY_LABELS[actionItem.tdvsp_priority]}
              </Badge>
            )}
            {actionItem.tdvsp_taskstatus != null && (
              <Badge variant={statusVariant(actionItem.tdvsp_taskstatus)}>
                {STATUS_LABELS[actionItem.tdvsp_taskstatus]}
              </Badge>
            )}
            {actionItem.tdvsp_tasktype != null && (
              <Badge variant="outline">
                {TASK_TYPE_LABELS[actionItem.tdvsp_tasktype]}
              </Badge>
            )}
          </div>

          <Separator />

          <dl>
            <DetailRow label="Customer" value={customerName} />
            <DetailRow
              label="Date"
              value={actionItem.tdvsp_date ? new Date(actionItem.tdvsp_date).toLocaleDateString() : null}
            />
            <DetailRow
              label="Priority"
              value={actionItem.tdvsp_priority != null ? PRIORITY_LABELS[actionItem.tdvsp_priority] : null}
            />
            <DetailRow
              label="Status"
              value={actionItem.tdvsp_taskstatus != null ? STATUS_LABELS[actionItem.tdvsp_taskstatus] : null}
            />
            <DetailRow
              label="Type"
              value={actionItem.tdvsp_tasktype != null ? TASK_TYPE_LABELS[actionItem.tdvsp_tasktype] : null}
            />
          </dl>

          {actionItem.tdvsp_description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">
                  {actionItem.tdvsp_description}
                </p>
              </div>
            </>
          )}

          <Separator />
          <dl>
            <DetailRow label="Owner" value={actionItem.owneridname} />
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}
