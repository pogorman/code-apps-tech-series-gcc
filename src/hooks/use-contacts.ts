import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContactsService } from "@/generated";
import type { ContactsModel } from "@/generated";

const CONTACTS_KEY = ["contacts"] as const;
const ACCOUNTS_KEY = ["accounts"] as const;

export function useContacts(options?: { filter?: string; orderBy?: string[] }) {
  return useQuery({
    queryKey: [...CONTACTS_KEY, options],
    queryFn: async () => {
      const activeFilter = "statecode eq 0";
      const filter = options?.filter
        ? `${activeFilter} and (${options.filter})`
        : activeFilter;
      const result = await ContactsService.getAll({
        filter,
        orderBy: options?.orderBy ?? ["lastname asc"],
      });
      return result.data ?? [];
    },
  });
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: [...CONTACTS_KEY, id],
    queryFn: async () => {
      const result = await ContactsService.get(id!);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      record: Omit<ContactsModel.ContactsBase, "address1_addressid">
    ) => {
      const result = await ContactsService.create(record);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fields,
    }: {
      id: string;
      fields: Partial<
        Omit<ContactsModel.ContactsBase, "address1_addressid">
      >;
    }) => {
      const result = await ContactsService.update(id, fields);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await ContactsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}
