import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tdvsp_ideasService } from "@/generated";
import type { Tdvsp_ideasModel } from "@/generated";

const IDEAS_KEY = ["ideas"] as const;

export function useIdeas(options?: { filter?: string; orderBy?: string[] }) {
  return useQuery({
    queryKey: [...IDEAS_KEY, options],
    queryFn: async () => {
      const activeFilter = "statecode eq 0";
      const filter = options?.filter
        ? `${activeFilter} and (${options.filter})`
        : activeFilter;
      const result = await Tdvsp_ideasService.getAll({
        filter,
        orderBy: options?.orderBy ?? ["tdvsp_name asc"],
      });
      return result.data ?? [];
    },
  });
}

export function useIdea(id: string | undefined) {
  return useQuery({
    queryKey: [...IDEAS_KEY, id],
    queryFn: async () => {
      const result = await Tdvsp_ideasService.get(id!);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      record: Omit<Tdvsp_ideasModel.Tdvsp_ideasBase, "tdvsp_ideaid">
    ) => {
      const result = await Tdvsp_ideasService.create(record);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IDEAS_KEY });
    },
  });
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fields,
    }: {
      id: string;
      fields: Partial<Omit<Tdvsp_ideasModel.Tdvsp_ideasBase, "tdvsp_ideaid">>;
    }) => {
      const result = await Tdvsp_ideasService.update(id, fields);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IDEAS_KEY });
    },
  });
}

export function useDeleteIdea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await Tdvsp_ideasService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IDEAS_KEY });
    },
  });
}
