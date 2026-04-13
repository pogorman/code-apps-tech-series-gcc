import { useEffect, useMemo, useState } from "react";
import { useContacts, useDeleteContact } from "@/hooks/use-contacts";
import { useAccounts } from "@/hooks/use-accounts";
import { getParentAccountId } from "@/lib/get-parent-account-id";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactFormDialog } from "./contact-form-dialog";
import { ContactDetailDialog } from "./contact-detail-dialog";
import { ContactDeleteDialog } from "./contact-delete-dialog";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import type { ContactsModel } from "@/generated";
import { toast } from "sonner";
import { useQuickCreateStore } from "@/stores/quick-create-store";
import { useViewPreference } from "@/hooks/use-view-preference";
import { ViewToggle } from "@/components/ui/view-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Contact = ContactsModel.Contacts;

export function ContactList() {
  const quickTarget = useQuickCreateStore((s) => s.target);
  const clearQuickCreate = useQuickCreateStore((s) => s.clear);

  const [viewMode, setViewMode] = useViewPreference("contacts");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (quickTarget === "contacts") {
      setCreateOpen(true);
      clearQuickCreate();
    }
  }, [quickTarget, clearQuickCreate]);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);

  const escaped = search.replace(/'/g, "''");
  const filter = search
    ? `contains(firstname, '${escaped}') or contains(lastname, '${escaped}')`
    : undefined;

  const { data: contacts, isLoading, error } = useContacts({ filter });
  const { data: accounts } = useAccounts();
  const deleteMutation = useDeleteContact();

  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts?.forEach((a) => map.set(a.accountid, a.name));
    return map;
  }, [accounts]);

  function handleDelete() {
    if (!deleteContact) return;
    const name =
      deleteContact.fullname ??
      `${deleteContact.firstname ?? ""} ${deleteContact.lastname}`.trim();
    deleteMutation.mutate(deleteContact.contactid, {
      onSuccess: () => {
        toast.success(`Deleted "${name}"`);
        setDeleteContact(null);
      },
      onError: (err) => {
        toast.error(`Delete failed: ${err.message}`);
      },
    });
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Failed to load contacts: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">Manage your customer contacts</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : contacts?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    {search
                      ? "No contacts match your search."
                      : "No contacts found. Create one to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                contacts?.map((contact) => {
                  const displayName =
                    contact.fullname ??
                    `${contact.firstname ?? ""} ${contact.lastname}`.trim();
                  return (
                    <TableRow
                      key={contact.contactid}
                      className="cursor-pointer"
                      onClick={() => setViewContact(contact)}
                    >
                      <TableCell className="font-medium">{displayName}</TableCell>
                      <TableCell>
                        {accountNameMap.get(getParentAccountId(contact) ?? "") ?? "\u2014"}
                      </TableCell>
                      <TableCell>{contact.emailaddress1 ?? "\u2014"}</TableCell>
                      <TableCell>{contact.jobtitle ?? "\u2014"}</TableCell>
                      <TableCell>
                        <div
                          className="flex gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditContact(contact)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteContact(contact)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : contacts?.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {search ? "No contacts match your search." : "No contacts found. Create one to get started."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts?.map((contact) => {
            const displayName =
              contact.fullname ??
              `${contact.firstname ?? ""} ${contact.lastname}`.trim();
            return (
              <Card
                key={contact.contactid}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setViewContact(contact)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold">{displayName}</CardTitle>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditContact(contact)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteContact(contact)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Account: </span>
                    {accountNameMap.get(getParentAccountId(contact) ?? "") ?? "\u2014"}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Email: </span>
                    {contact.emailaddress1 ?? "\u2014"}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Title: </span>
                    {contact.jobtitle ?? "\u2014"}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ContactFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />

      <ContactFormDialog
        open={!!editContact}
        onOpenChange={(open) => {
          if (!open) setEditContact(null);
        }}
        mode="edit"
        contact={editContact ?? undefined}
      />

      <ContactDetailDialog
        open={!!viewContact}
        onOpenChange={(open) => {
          if (!open) setViewContact(null);
        }}
        contact={viewContact ?? undefined}
        onEdit={(contact) => {
          setViewContact(null);
          setEditContact(contact);
        }}
      />

      <ContactDeleteDialog
        open={!!deleteContact}
        onOpenChange={(open) => {
          if (!open) setDeleteContact(null);
        }}
        contactName={
          deleteContact
            ? (deleteContact.fullname ??
              `${deleteContact.firstname ?? ""} ${deleteContact.lastname}`.trim())
            : ""
        }
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
