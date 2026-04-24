import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tdvsp_meetingsummariesService } from "@/generated";
import type { Tdvsp_meetingsummariesModel } from "@/generated";

const MEETING_SUMMARIES_KEY = ["meeting-summaries"] as const;

export function useMeetingSummaries(options?: { filter?: string; orderBy?: string[] }) {
  return useQuery({
    queryKey: [...MEETING_SUMMARIES_KEY, options],
    queryFn: async () => {
      const activeFilter = "statecode eq 0";
      const filter = options?.filter
        ? `${activeFilter} and (${options.filter})`
        : activeFilter;
      const result = await Tdvsp_meetingsummariesService.getAll({
        filter,
        orderBy: options?.orderBy ?? ["tdvsp_name asc"],
      });
      return result.data ?? [];
    },
  });
}

/** Returns every meeting summary regardless of statecode. Powers both the
 *  Active tabs and the Archived tab from a single client-side source. */
export function useAllMeetingSummaries(options?: { orderBy?: string[] }) {
  return useQuery({
    queryKey: [...MEETING_SUMMARIES_KEY, "all", options],
    queryFn: async () => {
      const result = await Tdvsp_meetingsummariesService.getAll({
        orderBy: options?.orderBy ?? ["tdvsp_date desc"],
      });
      return result.data ?? [];
    },
  });
}

export function useMeetingSummary(id: string | undefined) {
  return useQuery({
    queryKey: [...MEETING_SUMMARIES_KEY, id],
    queryFn: async () => {
      const result = await Tdvsp_meetingsummariesService.get(id!);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateMeetingSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      record: Omit<Tdvsp_meetingsummariesModel.Tdvsp_meetingsummariesBase, "tdvsp_meetingsummaryid">
    ) => {
      const result = await Tdvsp_meetingsummariesService.create(record);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETING_SUMMARIES_KEY });
    },
  });
}

export function useUpdateMeetingSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      fields,
    }: {
      id: string;
      fields: Partial<Omit<Tdvsp_meetingsummariesModel.Tdvsp_meetingsummariesBase, "tdvsp_meetingsummaryid">>;
    }) => {
      const result = await Tdvsp_meetingsummariesService.update(id, fields);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETING_SUMMARIES_KEY });
    },
  });
}

export function useDeleteMeetingSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await Tdvsp_meetingsummariesService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETING_SUMMARIES_KEY });
    },
  });
}
