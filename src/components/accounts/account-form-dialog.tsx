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
import { useCreateAccount, useUpdateAccount } from "@/hooks/use-accounts";
import type { AccountsModel } from "@/generated";
import { toast } from "sonner";

type Account = AccountsModel.Accounts;

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  account?: Account;
}

interface FormData {
  name: string;
  accountnumber: string;
  telephone1: string;
  emailaddress1: string;
  websiteurl: string;
  address1_line1: string;
  address1_city: string;
  address1_stateorprovince: string;
  address1_postalcode: string;
  description: string;
}

const EMPTY_FORM: FormData = {
  name: "",
  accountnumber: "",
  telephone1: "",
  emailaddress1: "",
  websiteurl: "",
  address1_line1: "",
  address1_city: "",
  address1_stateorprovince: "",
  address1_postalcode: "",
  description: "",
};

function accountToForm(account: Account): FormData {
  return {
    name: account.name ?? "",
    accountnumber: account.accountnumber ?? "",
    telephone1: account.telephone1 ?? "",
    emailaddress1: account.emailaddress1 ?? "",
    websiteurl: account.websiteurl ?? "",
    address1_line1: account.address1_line1 ?? "",
    address1_city: account.address1_city ?? "",
    address1_stateorprovince: account.address1_stateorprovince ?? "",
    address1_postalcode: account.address1_postalcode ?? "",
    description: account.description ?? "",
  };
}

export function AccountFormDialog({
  open,
  onOpenChange,
  mode,
  account,
}: AccountFormDialogProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setForm(mode === "edit" && account ? accountToForm(account) : EMPTY_FORM);
    }
  }, [open, mode, account]);

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Account name is required");
      return;
    }

    const record: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(form)) {
      record[key] = value.trim() || undefined;
    }

    if (mode === "create") {
      createMutation.mutate(
        record as unknown as Omit<AccountsModel.AccountsBase, "accountid">,
        {
          onSuccess: () => {
            toast.success(`Created "${form.name}"`);
            onOpenChange(false);
          },
          onError: (err) => toast.error(`Create failed: ${err.message}`),
        }
      );
    } else if (account) {
      updateMutation.mutate(
        { id: account.accountid, fields: record },
        {
          onSuccess: () => {
            toast.success(`Updated "${form.name}"`);
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
            {mode === "create" ? "New Account" : `Edit ${account?.name ?? ""}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Contoso Ltd."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="accountnumber">Account Number</Label>
                <Input
                  id="accountnumber"
                  value={form.accountnumber}
                  onChange={(e) => updateField("accountnumber", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telephone1">Phone</Label>
                <Input
                  id="telephone1"
                  value={form.telephone1}
                  onChange={(e) => updateField("telephone1", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="emailaddress1">Email</Label>
                <Input
                  id="emailaddress1"
                  type="email"
                  value={form.emailaddress1}
                  onChange={(e) => updateField("emailaddress1", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="websiteurl">Website</Label>
                <Input
                  id="websiteurl"
                  value={form.websiteurl}
                  onChange={(e) => updateField("websiteurl", e.target.value)}
                  placeholder="https://contoso.com"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address1_line1">Street</Label>
              <Input
                id="address1_line1"
                value={form.address1_line1}
                onChange={(e) => updateField("address1_line1", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="address1_city">City</Label>
                <Input
                  id="address1_city"
                  value={form.address1_city}
                  onChange={(e) => updateField("address1_city", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address1_stateorprovince">State</Label>
                <Input
                  id="address1_stateorprovince"
                  value={form.address1_stateorprovince}
                  onChange={(e) =>
                    updateField("address1_stateorprovince", e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address1_postalcode">Zip</Label>
                <Input
                  id="address1_postalcode"
                  value={form.address1_postalcode}
                  onChange={(e) =>
                    updateField("address1_postalcode", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
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
