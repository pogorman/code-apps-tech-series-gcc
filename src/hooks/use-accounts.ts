import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountsService } from "@/generated";
import type { AccountsModel } from "@/generated";

const ACCOUNTS_KEY = ["accounts"] as const;

export function useAccounts(options?: { filter?: string; orderBy?: string[] }) {
  return useQuery({
    queryKey: [...ACCOUNTS_KEY, options],
    queryFn: async () => {
      const activeFilter = "statecode eq 0";
      const filter = options?.filter
        ? `${activeFilter} and (${options.filter})`
        : activeFilter;
      const result = await AccountsService.getAll({
        filter,
        orderBy: options?.orderBy ?? ["name asc"],
      });
      return result.data ?? [];
    },
  });
}

export function useAccount(id: string | undefined) {
  return useQuery({
    queryKey: [...ACCOUNTS_KEY, id],
    queryFn: async () => {
      const result = await AccountsService.get(id!);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      record: Omit<AccountsModel.AccountsBase, "accountid">
    ) => {
      const result = await AccountsService.create(record);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fields,
    }: {
      id: string;
      fields: Partial<Omit<AccountsModel.AccountsBase, "accountid">>;
    }) => {
      const result = await AccountsService.update(id, fields);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await AccountsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}
