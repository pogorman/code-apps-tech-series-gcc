import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ContactsModel } from "@/generated";
import { useAccounts } from "@/hooks/use-accounts";
import { getParentAccountId } from "@/lib/get-parent-account-id";
import { Pencil } from "lucide-react";

type Contact = ContactsModel.Contacts;

interface ContactDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  onEdit: (contact: Contact) => void;
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

export function ContactDetailDialog({
  open,
  onOpenChange,
  contact,
  onEdit,
}: ContactDetailDialogProps) {
  const { data: accounts } = useAccounts();

  if (!contact) return null;

  const displayName = contact.fullname ?? `${contact.firstname ?? ""} ${contact.lastname}`.trim();
  const parentAccountId = getParentAccountId(contact);
  const accountName = parentAccountId
    ? accounts?.find((a) => a.accountid === parentAccountId)?.name
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>{displayName}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(contact)}
            >
              <Pencil className="mr-2 h-3 w-3" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={contact.statecode === 0 ? "default" : "secondary"}>
              {contact.statecodename ?? "Active"}
            </Badge>
            {contact.jobtitle && (
              <Badge variant="outline">{contact.jobtitle}</Badge>
            )}
          </div>

          <Separator />

          <dl>
            <DetailRow label="Account" value={accountName} />
            <DetailRow label="Job Title" value={contact.jobtitle} />
            <DetailRow label="Email" value={contact.emailaddress1} />
            <DetailRow label="Phone" value={contact.telephone1} />
            <DetailRow label="Mobile" value={contact.mobilephone} />
          </dl>

          {(contact.address1_line1 || contact.address1_city) && (
            <>
              <Separator />
              <dl>
                <DetailRow label="Street" value={contact.address1_line1} />
                <DetailRow label="City" value={contact.address1_city} />
                <DetailRow label="State" value={contact.address1_stateorprovince} />
                <DetailRow label="Zip" value={contact.address1_postalcode} />
              </dl>
            </>
          )}

          {contact.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">
                  {contact.description}
                </p>
              </div>
            </>
          )}

          <Separator />
          <dl>
            <DetailRow label="Owner" value={contact.owneridname} />
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}
