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
import { useCreateProject, useUpdateProject } from "@/hooks/use-projects";
import { useAccounts } from "@/hooks/use-accounts";
import type { Tdvsp_projectsModel } from "@/generated";
import { toast } from "sonner";
import { PROJECT_PRIORITY_LABELS } from "./labels";

type Project = Tdvsp_projectsModel.Tdvsp_projects;

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  project?: Project;
}

interface FormData {
  tdvsp_name: string;
  tdvsp_description: string;
  tdvsp_priority: string;
  tdvsp_account: string;
}

const EMPTY_FORM: FormData = {
  tdvsp_name: "",
  tdvsp_description: "",
  tdvsp_priority: "",
  tdvsp_account: "",
};

const NONE_VALUE = "__none__";

function projectToForm(item: Project): FormData {
  const accountId = (item as unknown as Record<string, string>)._tdvsp_account_value ?? "";
  return {
    tdvsp_name: item.tdvsp_name ?? "",
    tdvsp_description: item.tdvsp_description ?? "",
    tdvsp_priority: item.tdvsp_priority != null ? String(item.tdvsp_priority) : "",
    tdvsp_account: accountId,
  };
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  mode,
  project,
}: ProjectFormDialogProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const { data: accounts } = useAccounts();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setForm(mode === "edit" && project ? projectToForm(project) : EMPTY_FORM);
    }
  }, [open, mode, project]);

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
      tdvsp_priority: form.tdvsp_priority ? Number(form.tdvsp_priority) : undefined,
    };

    if (form.tdvsp_account) {
      record["tdvsp_Account@odata.bind"] = `/accounts(${form.tdvsp_account})`;
    } else {
      record["tdvsp_Account@odata.bind"] = undefined;
    }

    if (mode === "create") {
      createMutation.mutate(
        record as unknown as Omit<Tdvsp_projectsModel.Tdvsp_projectsBase, "tdvsp_projectid">,
        {
          onSuccess: () => {
            toast.success(`Created "${form.tdvsp_name}"`);
            onOpenChange(false);
          },
          onError: (err) => toast.error(`Create failed: ${err.message}`),
        },
      );
    } else if (project) {
      updateMutation.mutate(
        { id: project.tdvsp_projectid, fields: record },
        {
          onSuccess: () => {
            toast.success(`Updated "${form.tdvsp_name}"`);
            onOpenChange(false);
          },
          onError: (err) => toast.error(`Update failed: ${err.message}`),
        },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New Project" : `Edit ${project?.tdvsp_name ?? ""}`}
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
                placeholder="Code Apps Tech Series"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    {Object.entries(PROJECT_PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tdvsp_account">Account</Label>
                <Select
                  value={form.tdvsp_account || NONE_VALUE}
                  onValueChange={(v) =>
                    updateField("tdvsp_account", v === NONE_VALUE ? "" : v)
                  }
                >
                  <SelectTrigger id="tdvsp_account">
                    <SelectValue placeholder="Select an account" />
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
