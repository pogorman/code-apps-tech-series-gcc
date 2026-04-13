import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateActionItem, useUpdateActionItem } from "@/hooks/use-action-items";
import { useAccounts } from "@/hooks/use-accounts";
import type { Tdvsp_actionitemsModel } from "@/generated";
import { toast } from "sonner";
import { PRIORITY_LABELS, STATUS_LABELS, TASK_TYPE_LABELS } from "./labels";

type ActionItem = Tdvsp_actionitemsModel.Tdvsp_actionitems;

interface ActionItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  actionItem?: ActionItem;
  defaultTaskType?: number;
}

interface FormData {
  tdvsp_name: string;
  tdvsp_description: string;
  tdvsp_date: string;
  tdvsp_priority: string;
  tdvsp_taskstatus: string;
  tdvsp_tasktype: string;
  tdvsp_customer: string;
}

const EMPTY_FORM: FormData = {
  tdvsp_name: "",
  tdvsp_description: "",
  tdvsp_date: "",
  tdvsp_priority: "",
  tdvsp_taskstatus: "",
  tdvsp_tasktype: "",
  tdvsp_customer: "",
};

const NONE_VALUE = "__none__";

function actionItemToForm(item: ActionItem): FormData {
  const customerId = (item as unknown as Record<string, string>)._tdvsp_customer_value ?? "";
  return {
    tdvsp_name: item.tdvsp_name ?? "",
    tdvsp_description: item.tdvsp_description ?? "",
    tdvsp_date: item.tdvsp_date ? item.tdvsp_date.slice(0, 10) : "",
    tdvsp_priority: item.tdvsp_priority != null ? String(item.tdvsp_priority) : "",
    tdvsp_taskstatus: item.tdvsp_taskstatus != null ? String(item.tdvsp_taskstatus) : "",
    tdvsp_tasktype: item.tdvsp_tasktype != null ? String(item.tdvsp_tasktype) : "",
    tdvsp_customer: customerId,
  };
}

export function ActionItemFormDialog({
  open,
  onOpenChange,
  mode,
  actionItem,
  defaultTaskType,
}: ActionItemFormDialogProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const createMutation = useCreateActionItem();
  const updateMutation = useUpdateActionItem();
  const { data: accounts } = useAccounts();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (mode === "edit" && actionItem) {
        setForm(actionItemToForm(actionItem));
      } else {
        setForm({
          ...EMPTY_FORM,
          ...(defaultTaskType != null ? { tdvsp_tasktype: String(defaultTaskType) } : {}),
        });
      }
    }
  }, [open, mode, actionItem, defaultTaskType]);

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.tdvsp_name.trim()) {
      toast.error("Name is required");
      return;
    }

    const record: Record<string, unknown> = {
      tdvsp_name: form.tdvsp_name.trim(),
      tdvsp_description: form.tdvsp_description.trim() || undefined,
      tdvsp_date: form.tdvsp_date || undefined,
      tdvsp_priority: form.tdvsp_priority ? Number(form.tdvsp_priority) : undefined,
      tdvsp_taskstatus: form.tdvsp_taskstatus ? Number(form.tdvsp_taskstatus) : undefined,
      tdvsp_tasktype: form.tdvsp_tasktype ? Number(form.tdvsp_tasktype) : undefined,
    };

    if (form.tdvsp_customer) {
      record["tdvsp_Customer@odata.bind"] = `/accounts(${form.tdvsp_customer})`;
    } else {
      record["tdvsp_Customer@odata.bind"] = undefined;
    }

    if (mode === "create") {
      createMutation.mutate(
        record as unknown as Omit<Tdvsp_actionitemsModel.Tdvsp_actionitemsBase, "tdvsp_actionitemid">,
        {
          onSuccess: () => {
            toast.success(`Created "${form.tdvsp_name}"`);
            onOpenChange(false);
          },
          onError: (err) => toast.error(`Create failed: ${err.message}`),
        }
      );
    } else if (actionItem) {
      updateMutation.mutate(
        { id: actionItem.tdvsp_actionitemid, fields: record },
        {
          onSuccess: () => {
            toast.success(`Updated "${form.tdvsp_name}"`);
            onOpenChange(false);
          },
          onError: (err) => toast.error(`Update failed: ${err.message}`),
        }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New Action Item" : `Edit ${actionItem?.tdvsp_name ?? ""}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tdvsp_name">Name *</Label>
              <Input
                id="tdvsp_name"
                value={form.tdvsp_name}
                onChange={(e) => updateField("tdvsp_name", e.target.value)}
                placeholder="Follow up with customer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tdvsp_customer">Customer</Label>
                <Select
                  value={form.tdvsp_customer || NONE_VALUE}
                  onValueChange={(v) =>
                    updateField("tdvsp_customer", v === NONE_VALUE ? "" : v)
                  }
                >
                  <SelectTrigger id="tdvsp_customer">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {accounts?.map((a) => (
                      <SelectItem key={a.accountid} value={a.accountid}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tdvsp_date">Date</Label>
                <Input
                  id="tdvsp_date"
                  type="date"
                  value={form.tdvsp_date}
                  onChange={(e) => updateField("tdvsp_date", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tdvsp_priority">Priority</Label>
                <Select
                  value={form.tdvsp_priority || NONE_VALUE}
                  onValueChange={(v) =>
                    updateField("tdvsp_priority", v === NONE_VALUE ? "" : v)
                  }
                >
                  <SelectTrigger id="tdvsp_priority">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tdvsp_taskstatus">Status</Label>
                <Select
                  value={form.tdvsp_taskstatus || NONE_VALUE}
                  onValueChange={(v) =>
                    updateField("tdvsp_taskstatus", v === NONE_VALUE ? "" : v)
                  }
                >
                  <SelectTrigger id="tdvsp_taskstatus">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tdvsp_tasktype">Type</Label>
                <Select
                  value={form.tdvsp_tasktype || NONE_VALUE}
                  onValueChange={(v) =>
                    updateField("tdvsp_tasktype", v === NONE_VALUE ? "" : v)
                  }
                >
                  <SelectTrigger id="tdvsp_tasktype">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {Object.entries(TASK_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tdvsp_description">Description</Label>
              <Textarea
                id="tdvsp_description"
                value={form.tdvsp_description}
                onChange={(e) => updateField("tdvsp_description", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : mode === "create"
                  ? "Create"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
