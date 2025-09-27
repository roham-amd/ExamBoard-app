"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/src/lib/axios";
import { queryKeys } from "@/src/lib/query-keys";

import type {
  Allocation,
  Blackout,
  Holiday,
  Room,
  Term,
  Exam,
  PaginatedResponse,
} from "@/src/types/api";

import type {
  AllocationFormValues,
  BlackoutFormValues,
  ExamFormValues,
  HolidayFormValues,
  RoomFormValues,
  TermFormValues,
} from "@/src/lib/schemas";

type Identifiable = { id: number };

const prependItem = <T>(
  queryClient: ReturnType<typeof useQueryClient>,
  resourceKey: readonly unknown[],

  item: T,
) => {
  const queries = queryClient.getQueriesData<PaginatedResponse<T>>({
    queryKey: resourceKey,
  });
  for (const [key, data] of queries) {
    if (!data) continue;
    queryClient.setQueryData(key, {
      ...data,
      count: data.count + 1,
      results: [item, ...data.results],
    });
  }
};

const replaceItem = <T extends Identifiable>(
  queryClient: ReturnType<typeof useQueryClient>,
  resourceKey: readonly unknown[],

  item: T,
) => {
  const queries = queryClient.getQueriesData<PaginatedResponse<T>>({
    queryKey: resourceKey,
  });
  for (const [key, data] of queries) {
    if (!data) continue;
    const exists = data.results.some((entry) => entry.id === item.id);
    if (!exists) continue;
    queryClient.setQueryData(key, {
      ...data,
      results: data.results.map((entry) =>
        entry.id === item.id ? item : entry,
      ),
    });
  }
};

const removeItem = <T extends Identifiable>(
  queryClient: ReturnType<typeof useQueryClient>,
  resourceKey: readonly unknown[],

  id: number,
) => {
  const queries = queryClient.getQueriesData<PaginatedResponse<T>>({
    queryKey: resourceKey,
  });
  for (const [key, data] of queries) {
    if (!data) continue;
    if (!data.results.some((entry) => entry.id === id)) continue;
    queryClient.setQueryData(key, {
      ...data,
      count: Math.max(0, data.count - 1),
      results: data.results.filter((entry) => entry.id !== id),
    });
  }
};

export const useCreateRoomMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RoomFormValues) => {
      const { data } = await api.post<Room>("/rooms/", payload);
      return data;
    },
    onSuccess: (room) => {
      prependItem(queryClient, queryKeys.rooms.all, room);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
    },
  });
};

export const useUpdateRoomMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RoomFormValues }) => {
      const response = await api.patch<Room>(`/rooms/${id}/`, data);
      return response.data;
    },
    onSuccess: (room) => {
      replaceItem(queryClient, queryKeys.rooms.all, room);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
    },
  });
};

export const useDeleteRoomMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/rooms/${id}/`);
      return id;
    },
    onSuccess: (id) => {
      removeItem(queryClient, queryKeys.rooms.all, id);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
    },
  });
};

export const useCreateTermMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TermFormValues) => {
      const { data } = await api.post<Term>("/terms/", payload);
      return data;
    },
    onSuccess: (term) => {
      prependItem(queryClient, queryKeys.terms.all, term);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.terms.all });
    },
  });
};

export const useUpdateTermMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TermFormValues }) => {
      const response = await api.patch<Term>(`/terms/${id}/`, data);
      return response.data;
    },
    onSuccess: (term) => {
      replaceItem(queryClient, queryKeys.terms.all, term);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.terms.all });
    },
  });
};

export const usePublishTermMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<Term>(`/terms/${id}/publish/`);
      return data;
    },
    onSuccess: (term) => {
      replaceItem(queryClient, queryKeys.terms.all, term);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.terms.all });
    },
  });
};

export const useDeleteTermMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/terms/${id}/`);
      return id;
    },
    onSuccess: (id) => {
      removeItem(queryClient, queryKeys.terms.all, id);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.terms.all });
    },
  });
};

export const useCreateExamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ExamFormValues) => {
      const { data } = await api.post<Exam>("/exams/", payload);
      return data;
    },
    onSuccess: (exam) => {
      prependItem(queryClient, queryKeys.exams.all, exam);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
    },
  });
};

export const useUpdateExamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ExamFormValues }) => {
      const response = await api.patch<Exam>(`/exams/${id}/`, data);
      return response.data;
    },
    onSuccess: (exam) => {
      replaceItem(queryClient, queryKeys.exams.all, exam);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
    },
  });
};

export const useDeleteExamMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/exams/${id}/`);
      return id;
    },
    onSuccess: (id) => {
      removeItem(queryClient, queryKeys.exams.all, id);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
    },
  });
};

export const useCreateAllocationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AllocationFormValues) => {
      const { data } = await api.post<Allocation>("/allocations/", payload);
      return data;
    },
    onSuccess: (allocation) => {
      prependItem(queryClient, queryKeys.allocations.all, allocation);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.allocations.all,
      });
    },
  });
};

export const useUpdateAllocationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: AllocationFormValues;
    }) => {
      const response = await api.patch<Allocation>(`/allocations/${id}/`, data);
      return response.data;
    },
    onSuccess: (allocation) => {
      replaceItem(queryClient, queryKeys.allocations.all, allocation);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.allocations.all,
      });
    },
  });
};

export const useDeleteAllocationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/allocations/${id}/`);
      return id;
    },
    onSuccess: (id) => {
      removeItem(queryClient, queryKeys.allocations.all, id);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.allocations.all,
      });
    },
  });
};

export const useCreateBlackoutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BlackoutFormValues) => {
      const { data } = await api.post<Blackout>("/blackouts/", payload);
      return data;
    },
    onSuccess: (blackout) => {
      prependItem(queryClient, queryKeys.blackouts.all, blackout);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.blackouts.all });
    },
  });
};

export const useUpdateBlackoutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: BlackoutFormValues;
    }) => {
      const response = await api.patch<Blackout>(`/blackouts/${id}/`, data);
      return response.data;
    },
    onSuccess: (blackout) => {
      replaceItem(queryClient, queryKeys.blackouts.all, blackout);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.blackouts.all });
    },
  });
};

export const useDeleteBlackoutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/blackouts/${id}/`);
      return id;
    },
    onSuccess: (id) => {
      removeItem(queryClient, queryKeys.blackouts.all, id);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.blackouts.all });
    },
  });
};

export const useCreateHolidayMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HolidayFormValues) => {
      const { data } = await api.post<Holiday>("/holidays/", payload);
      return data;
    },
    onSuccess: (holiday) => {
      prependItem(queryClient, queryKeys.holidays.all, holiday);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.holidays.all });
    },
  });
};

export const useUpdateHolidayMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: HolidayFormValues;
    }) => {
      const response = await api.patch<Holiday>(`/holidays/${id}/`, data);
      return response.data;
    },
    onSuccess: (holiday) => {
      replaceItem(queryClient, queryKeys.holidays.all, holiday);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.holidays.all });
    },
  });
};

export const useDeleteHolidayMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/holidays/${id}/`);
      return id;
    },
    onSuccess: (id) => {
      removeItem(queryClient, queryKeys.holidays.all, id);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.holidays.all });
    },
  });
};
