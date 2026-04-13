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
import { useCreateContact, useUpdateContact } from "@/hooks/use-contacts";
import { useAccounts } from "@/hooks/use-accounts";
import { getParentAccountId } from "@/lib/get-parent-account-id";
import type { ContactsModel } from "@/generated";
import { toast } from "sonner";

type Contact = ContactsModel.Contacts;

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  contact?: Contact;
}

interface FormData {
  firstname: string;
  lastname: string;
  parentcustomerid: string;
  jobtitle: string;
  emailaddress1: string;
  telephone1: string;
  mobilephone: string;
  address1_line1: string;
  address1_city: string;
  address1_stateorprovince: string;
  address1_postalcode: string;
  description: string;
}

const EMPTY_FORM: FormData = {
  firstname: "",
  lastname: "",
  parentcustomerid: "",
  jobtitle: "",
  emailaddress1: "",
  telephone1: "",
  mobilephone: "",
  address1_line1: "",
  address1_city: "",
  address1_stateorprovince: "",
  address1_postalcode: "",
  description: "",
};

function contactToForm(contact: Contact): FormData {
  return {
    firstname: contact.firstname ?? "",
    lastname: contact.lastname ?? "",
    parentcustomerid: getParentAccountId(contact) ?? "",
    jobtitle: contact.jobtitle ?? "",
    emailaddress1: contact.emailaddress1 ?? "",
    telephone1: contact.telephone1 ?? "",
    mobilephone: contact.mobilephone ?? "",
    address1_line1: contact.address1_line1 ?? "",
    address1_city: contact.address1_city ?? "",
    address1_stateorprovince: contact.address1_stateorprovince ?? "",
    address1_postalcode: contact.address1_postalcode ?? "",
    description: contact.description ?? "",
  };
}

const NONE_VALUE = "__none__";

export function ContactFormDialog({
  open,
  onOpenChange,
  mode,
  contact,
}: ContactFormDialogProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const { data: accounts } = useAccounts();
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setForm(mode === "edit" && contact ? contactToForm(contact) : EMPTY_FORM);
    }
  }, [open, mode, contact]);

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.lastname.trim()) {
      toast.error("Last name is required");
      return;
    }

    const record: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(form)) {
      if (key === "parentcustomerid") continue;
      record[key] = value.trim() || undefined;
    }
    if (form.parentcustomerid) {
      record.parentcustomerid = form.parentcustomerid;
      record.parentcustomeridtype = "account";
    } else {
      record.parentcustomerid = undefined;
      record.parentcustomeridtype = undefined;
    }

    if (mode === "create") {
      createMutation.mutate(
        record as unknown as Omit<
          ContactsModel.ContactsBase,
          "address1_addressid"
        >,
        {
          onSuccess: () => {
            toast.success(
              `Created "${`${form.firstname} ${form.lastname}`.trim()}"`
            );
            onOpenChange(false);
          },
          onError: (err) => toast.error(`Create failed: ${err.message}`),
        }
      );
    } else if (contact) {
      updateMutation.mutate(
        { id: contact.contactid, fields: record },
        {
          onSuccess: () => {
            toast.success(
              `Updated "${`${form.firstname} ${form.lastname}`.trim()}"`
            );
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
            {mode === "create"
              ? "New Contact"
              : `Edit ${contact?.fullname ?? contact?.lastname ?? ""}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  value={form.firstname}
                  onChange={(e) => updateField("firstname", e.target.value)}
                  placeholder="Jane"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastname">Last Name *</Label>
                <Input
                  id="lastname"
                  value={form.lastname}
                  onChange={(e) => updateField("lastname", e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="parentcustomerid">Account</Label>
                <Select
                  value={form.parentcustomerid || NONE_VALUE}
                  onValueChange={(v) =>
                    updateField("parentcustomerid", v === NONE_VALUE ? "" : v)
                  }
                >
                  <SelectTrigger id="parentcustomerid">
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
                <Label htmlFor="jobtitle">Job Title</Label>
                <Input
                  id="jobtitle"
                  value={form.jobtitle}
                  onChange={(e) => updateField("jobtitle", e.target.value)}
                  placeholder="VP of Sales"
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
                  placeholder="jane@contoso.com"
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
                <Label htmlFor="mobilephone">Mobile</Label>
                <Input
                  id="mobilephone"
                  value={form.mobilephone}
                  onChange={(e) => updateField("mobilephone", e.target.value)}
                  placeholder="(555) 987-6543"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address1_line1">Street</Label>
                <Input
                  id="address1_line1"
                  value={form.address1_line1}
                  onChange={(e) => updateField("address1_line1", e.target.value)}
                />
              </div>
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
