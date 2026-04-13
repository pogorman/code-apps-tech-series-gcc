import type { Tdvsp_actionitemsModel } from "@/generated";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  priorityVariant,
  statusVariant,
} from "@/components/action-items/labels";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ActionItem = Tdvsp_actionitemsModel.Tdvsp_actionitems;

interface DrilldownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: ActionItem[];
}

export function DrilldownDialog({ open, onOpenChange, title, items }: DrilldownDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {items.length} {items.length === 1 ? "item" : "items"}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Name</th>
                <th className="pb-2 pr-3 font-medium">Customer</th>
                <th className="pb-2 pr-3 font-medium">Priority</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.tdvsp_actionitemid}
                  className="border-b border-border/50"
                >
                  <td className="py-2 pr-3 font-medium max-w-[200px] truncate">
                    {item.tdvsp_name}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground max-w-[140px] truncate">
                    {item.tdvsp_customername ?? "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {item.tdvsp_priority != null ? (
                      <Badge variant={priorityVariant(item.tdvsp_priority)}>
                        {PRIORITY_LABELS[item.tdvsp_priority] ?? "—"}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {item.tdvsp_taskstatus != null ? (
                      <Badge variant={statusVariant(item.tdvsp_taskstatus)}>
                        {STATUS_LABELS[item.tdvsp_taskstatus] ?? "—"}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 text-muted-foreground whitespace-nowrap">
                    {item.tdvsp_date
                      ? new Date(item.tdvsp_date).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No items</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
