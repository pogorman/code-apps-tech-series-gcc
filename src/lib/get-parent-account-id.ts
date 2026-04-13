import type { ContactsModel } from "@/generated";

/**
 * Extract the parent account GUID from a contact.
 * Dataverse OData returns lookup IDs as `_parentcustomerid_value` at runtime,
 * but the generated type only declares `parentcustomerid` (the write field).
 */
export function getParentAccountId(
  contact: ContactsModel.Contacts
): string | undefined {
  return (
    contact.parentcustomerid ??
    (contact as unknown as Record<string, string>)._parentcustomerid_value ??
    undefined
  );
}
