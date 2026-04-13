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
import { useCreateMeetingSummary, useUpdateMeetingSummary } from "@/hooks/use-meeting-summaries";
import { useAccounts } from "@/hooks/use-accounts";
import { useProjects } from "@/hooks/use-projects";
import type { Tdvsp_meetingsummariesModel } from "@/generated";
import { toast } from "sonner";

type MeetingSummary = Tdvsp_meetingsummariesModel.Tdvsp_meetingsummaries;

interface MeetingSummaryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  meetingSummary?: MeetingSummary;
}

interface FormData {
  tdvsp_name: string;
  tdvsp_summary: string;
  tdvsp_date: string;
  tdvsp_account: string;
  tdvsp_project: string;
}

const EMPTY_FORM: FormData = {
  tdvsp_name: "",
  tdvsp_summary: "",
  tdvsp_date: "",
  tdvsp_account: "",
  tdvsp_project: "",
};

const NONE_VALUE = "__none__";

function meetingSummaryToForm(item: MeetingSummary): FormData {
  const raw = item as unknown as Record<string, string>;
  const accountId = raw._tdvsp_account_value ?? "";
  const projectId = raw._tdvsp_project_value ?? "";
  return {
    tdvsp_name: item.tdvsp_name ?? "",
    tdvsp_summary: item.tdvsp_summary ?? "",
    tdvsp_date: item.tdvsp_date ? item.tdvsp_date.slice(0, 10) : "",
    tdvsp_account: accountId,
    tdvsp_project: projectId,
  };
}

export function MeetingSummaryFormDialog({
  open,
  onOpenChange,
  mode,
  meetingSummary,
}: MeetingSummaryFormDialogProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const createMutation = useCreateMeetingSummary();
  const updateMutation = useUpdateMeetingSummary();
  const { data: accounts } = useAccounts();
  const { data: projectsList } = useProjects();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setForm(mode === "edit" && meetingSummary ? meetingSummaryToForm(meetingSummary) : EMPTY_FORM);
    }
  }, [open, mode, meetingSummary]);

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
      tdvsp_summary: form.tdvsp_summary.trim() || undefined,
      tdvsp_date: form.tdvsp_date || undefined,
    };

    if (form.tdvsp_account) {
      record["tdvsp_Account@odata.bind"] = `/accounts(${form.tdvsp_account})`;
    } else {
      record["tdvsp_Account@odata.bind"] = undefined;
    }

    if (form.tdvsp_project) {
      record["tdvsp_Project@odata.bind"] = `/tdvsp_projects(${form.tdvsp_project})`;
    } else {
      record["tdvsp_Project@odata.bind"] = undefined;
    }

    if (mode === "create") {
      createMutation.mutate(
        record as unknown as Omit<Tdvsp_meetingsummariesModel.Tdvsp_meetingsummariesBase, "tdvsp_meetingsummaryid">,
        {
          onSuccess: () => {
            toast.success(`Created "${form.tdvsp_name}"`);
            onOpenChange(false);
          },
          onError: (err) => toast.error(`Create failed: ${err.message}`),
        }
      );
    } else if (meetingSummary) {
      updateMutation.mutate(
        { id: meetingSummary.tdvsp_meetingsummaryid, fields: record },
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
            {mode === "create" ? "New Meeting Summary" : `Edit ${meetingSummary?.tdvsp_name ?? ""}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tdvsp_name">Title *</Label>
              <Input
                id="tdvsp_name"
                value={form.tdvsp_name}
                onChange={(e) => updateField("tdvsp_name", e.target.value)}
                placeholder="Q1 business review"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid gap-2">
              <Label htmlFor="tdvsp_summary">Summary</Label>
              <Textarea
                id="tdvsp_summary"
                value={form.tdvsp_summary}
                onChange={(e) => updateField("tdvsp_summary", e.target.value)}
                rows={5}
                placeholder="Key discussion points and outcomes..."
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
