import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tdvsp_projectsService } from "@/generated";
import type { Tdvsp_projectsModel } from "@/generated";

const PROJECTS_KEY = ["projects"] as const;

export function useProjects(options?: { filter?: string; orderBy?: string[] }) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, options],
    queryFn: async () => {
      const activeFilter = "statecode eq 0";
      const filter = options?.filter
        ? `${activeFilter} and (${options.filter})`
        : activeFilter;
      const result = await Tdvsp_projectsService.getAll({
        filter,
        orderBy: options?.orderBy ?? ["tdvsp_name asc"],
      });
      return result.data ?? [];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, id],
    queryFn: async () => {
      const result = await Tdvsp_projectsService.get(id!);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      record: Omit<Tdvsp_projectsModel.Tdvsp_projectsBase, "tdvsp_projectid">
    ) => {
      const result = await Tdvsp_projectsService.create(record);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fields,
    }: {
      id: string;
      fields: Partial<Omit<Tdvsp_projectsModel.Tdvsp_projectsBase, "tdvsp_projectid">>;
    }) => {
      const result = await Tdvsp_projectsService.update(id, fields);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await Tdvsp_projectsService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}
