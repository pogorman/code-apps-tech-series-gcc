import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { AccountsModel } from "@/generated";
import { useContacts } from "@/hooks/use-contacts";
import { Pencil, Users } from "lucide-react";

type Account = AccountsModel.Accounts;

interface AccountDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  onEdit: (account: Account) => void;
  onViewContact?: (contactId: string) => void;
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

export function AccountDetailDialog({
  open,
  onOpenChange,
  account,
  onEdit,
  onViewContact,
}: AccountDetailDialogProps) {
  const { data: contacts, isLoading: isLoadingContacts } = useContacts({
    filter: account
      ? `_parentcustomerid_value eq '${account.accountid}'`
      : undefined,
  });

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>{account.name}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(account)}
            >
              <Pencil className="mr-2 h-3 w-3" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={account.statecode === 0 ? "default" : "secondary"}>
              {account.statecodename ?? "Active"}
            </Badge>
            {account.industrycodename && (
              <Badge variant="outline">{account.industrycodename}</Badge>
            )}
          </div>

          <Separator />

          <dl>
            <DetailRow label="Account #" value={account.accountnumber} />
            <DetailRow label="Phone" value={account.telephone1} />
            <DetailRow label="Email" value={account.emailaddress1} />
            <DetailRow label="Website" value={account.websiteurl} />
          </dl>

          {(account.address1_line1 || account.address1_city) && (
            <>
              <Separator />
              <dl>
                <DetailRow label="Street" value={account.address1_line1} />
                <DetailRow label="City" value={account.address1_city} />
                <DetailRow label="State" value={account.address1_stateorprovince} />
                <DetailRow label="Zip" value={account.address1_postalcode} />
              </dl>
            </>
          )}

          {account.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{account.description}</p>
              </div>
            </>
          )}

          <Separator />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                Contacts{" "}
                {contacts && contacts.length > 0 && (
                  <span className="text-muted-foreground">
                    ({contacts.length})
                  </span>
                )}
              </p>
            </div>
            {isLoadingContacts ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : contacts && contacts.length > 0 ? (
              <div className="space-y-1">
                {contacts.map((c) => {
                  const name =
                    c.fullname ??
                    `${c.firstname ?? ""} ${c.lastname}`.trim();
                  return (
                    <div
                      key={c.contactid}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
                      onClick={() => onViewContact?.(c.contactid)}
                    >
                      <span>{name}</span>
                      <span className="text-muted-foreground text-xs">
                        {c.jobtitle ?? c.emailaddress1 ?? ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No contacts linked to this account.
              </p>
            )}
          </div>

          <Separator />
          <dl>
            <DetailRow label="Owner" value={account.owneridname} />
            <DetailRow label="Created" value={account.createdon} />
            <DetailRow label="Modified" value={account.modifiedon} />
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}
