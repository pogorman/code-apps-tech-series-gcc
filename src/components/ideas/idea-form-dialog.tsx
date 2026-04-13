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
import { useCreateIdea, useUpdateIdea } from "@/hooks/use-ideas";
import { useAccounts } from "@/hooks/use-accounts";
import { useContacts } from "@/hooks/use-contacts";
import { useProjects } from "@/hooks/use-projects";
import type { Tdvsp_ideasModel } from "@/generated";
import { toast } from "sonner";
import { CATEGORY_LABELS, IDEA_PRIORITY_LABELS } from "./labels";

type Idea = Tdvsp_ideasModel.Tdvsp_ideas;

interface IdeaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  idea?: Idea;
}

interface FormData {
  tdvsp_name: string;
  tdvsp_description: string;
  tdvsp_category: string;
  tdvsp_priority: string;
  tdvsp_account: string;
  tdvsp_contact: string;
  tdvsp_project: string;
}

const EMPTY_FORM: FormData = {
  tdvsp_name: "",
  tdvsp_description: "",
  tdvsp_category: "",
  tdvsp_priority: "",
  tdvsp_account: "",
  tdvsp_contact: "",
  tdvsp_project: "",
};

const NONE_VALUE = "__none__";

function ideaToForm(item: Idea): FormData {
  const raw = item as unknown as Record<string, string>;
  const accountId = raw._tdvsp_account_value ?? "";
  const contactId = raw._tdvsp_contact_value ?? "";
  const projectId = raw._tdvsp_project_value ?? "";
  return {
    tdvsp_name: item.tdvsp_name ?? "",
    tdvsp_description: item.tdvsp_description ?? "",
    tdvsp_category: item.tdvsp_category != null ? String(item.tdvsp_category) : "",
    tdvsp_priority: (item as unknown as Record<string, number>).tdvsp_priority != null
      ? String((item as unknown as Record<string, number>).tdvsp_priority)
      : "",
    tdvsp_account: accountId,
    tdvsp_contact: contactId,
    tdvsp_project: projectId,
  };
}

export function IdeaFormDialog({
  open,
  onOpenChange,
  mode,
  idea,
}: IdeaFormDialogProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const createMutation = useCreateIdea();
  const updateMutation = useUpdateIdea();
  const { data: accounts } = useAccounts();
  const { data: contacts } = useContacts();
  const { data: projectsList } = useProjects();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setForm(mode === "edit" && idea ? ideaToForm(idea) : EMPTY_FORM);
    }
  }, [open, mode, idea]);

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
      tdvsp_category: form.tdvsp_category ? Number(form.tdvsp_category) : undefined,
      tdvsp_priority: form.tdvsp_priority ? Number(form.tdvsp_priority) : undefined,
    };

    if (form.tdvsp_account) {
      record["tdvsp_Account@odata.bind"] = `/accounts(${form.tdvsp_account})`;
    } else {
      record["tdvsp_Account@odata.bind"] = undefined;
    }

    if (form.tdvsp_contact) {
      record["tdvsp_Contact@odata.bind"] = `/contacts(${form.tdvsp_contact})`;
    } else {
      record["tdvsp_Contact@odata.bind"] = undefined;
    }

    if (form.tdvsp_project) {
      record["tdvsp_Project@odata.bind"] = `/tdvsp_projects(${form.tdvsp_project})`;
    } else {
      record["tdvsp_Project@odata.bind"] = undefined;
    }

    if (mode === "create") {
      createMutation.mutate(
        record as unknown as Omit<Tdvsp_ideasModel.Tdvsp_ideasBase, "tdvsp_ideaid">,
        {
          onSuccess: () => {
            toast.success(`Created "${form.tdvsp_name}"`);
            onOpenChange(false);
          },
          onError: (err) => toast.error(`Create failed: ${err.message}`),
        }
      );
    } else if (idea) {
      updateMutation.mutate(
        { id: idea.tdvsp_ideaid, fields: record },
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
            {mode === "create" ? "New Idea" : `Edit ${idea?.tdvsp_name ?? ""}`}
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
                placeholder="AI-powered invoice processing"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tdvsp_category">Category</Label>
                <Select
                  value={form.tdvsp_category || NONE_VALUE}
                  onValueChange={(v) =>
                    updateField("tdvsp_category", v === NONE_VALUE ? "" : v)
                  }
                >
                  <SelectTrigger id="tdvsp_category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    {Object.entries(IDEA_PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tdvsp_project">Project</Label>
                <Select
                  value={form.tdvsp_project || NONE_VALUE}
                  onValueChange={(v) =>
                    updateField("tdvsp_project", v === NONE_VALUE ? "" : v)
                  }
                >
                  <SelectTrigger id="tdvsp_project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {projectsList?.map((p) => (
                      <SelectItem key={p.tdvsp_projectid} value={p.tdvsp_projectid}>
                        {p.tdvsp_name}
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
              <div className="grid gap-2">
                <Label htmlFor="tdvsp_contact">Contact</Label>
                <Select
                  value={form.tdvsp_contact || NONE_VALUE}
                  onValueChange={(v) =>
                    updateField("tdvsp_contact", v === NONE_VALUE ? "" : v)
                  }
                >
                  <SelectTrigger id="tdvsp_contact">
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {contacts?.map((c) => (
                      <SelectItem key={c.contactid} value={c.contactid}>
                        {c.firstname} {c.lastname}
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
