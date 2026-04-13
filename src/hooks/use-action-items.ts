import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tdvsp_actionitemsService } from "@/generated";
import type { Tdvsp_actionitemsModel } from "@/generated";
import confetti from "canvas-confetti";

const ACTION_ITEMS_KEY = ["action-items"] as const;

export function useActionItems(options?: { filter?: string; orderBy?: string[] }) {
  return useQuery({
    queryKey: [...ACTION_ITEMS_KEY, options],
    queryFn: async () => {
      const activeFilter = "statecode eq 0";
      const filter = options?.filter
        ? `${activeFilter} and (${options.filter})`
        : activeFilter;
      const result = await Tdvsp_actionitemsService.getAll({
        filter,
        orderBy: options?.orderBy ?? ["tdvsp_name asc"],
      });
      return result.data ?? [];
    },
  });
}

export function useActionItem(id: string | undefined) {
  return useQuery({
    queryKey: [...ACTION_ITEMS_KEY, id],
    queryFn: async () => {
      const result = await Tdvsp_actionitemsService.get(id!);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      record: Omit<Tdvsp_actionitemsModel.Tdvsp_actionitemsBase, "tdvsp_actionitemid">
    ) => {
      const result = await Tdvsp_actionitemsService.create(record);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTION_ITEMS_KEY });
    },
  });
}

export function useUpdateActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fields,
    }: {
      id: string;
      fields: Partial<Omit<Tdvsp_actionitemsModel.Tdvsp_actionitemsBase, "tdvsp_actionitemid">>;
    }) => {
      const result = await Tdvsp_actionitemsService.update(id, fields);
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ACTION_ITEMS_KEY });
      if (variables.fields.tdvsp_taskstatus === 468510005) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    },
  });
}

export function useDeleteActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await Tdvsp_actionitemsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTION_ITEMS_KEY });
    },
  });
}
