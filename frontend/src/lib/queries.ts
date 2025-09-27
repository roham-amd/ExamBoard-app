"use client";

import {
  keepPreviousData,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";

import api from "@/src/lib/axios";
import { queryKeys } from "@/src/lib/query-keys";

import type {
  AllocationListResponse,
  AllocationQueryParams,
  BlackoutListResponse,
  BlackoutQueryParams,
  ExamListResponse,
  ExamQueryParams,
  ExamOwnerListResponse,
  HolidayListResponse,
  HolidayQueryParams,
  PublicExamListResponse,
  PublicExamQueryParams,
  RoomListResponse,
  RoomQueryParams,
  TermListResponse,
  TermQueryParams,
} from "@/src/types/api";

type AnyKey = readonly unknown[];

type ListQueryOptions<TData, TKey extends AnyKey> = Omit<
  UseQueryOptions<TData, unknown, TData, TKey>,
  "queryKey" | "queryFn"
>;

type KeyFactory<TParams, TKey extends AnyKey> = (params?: TParams) => TKey;

type ListQueryHook<TData, TParams, TKey extends AnyKey> = (
  params?: TParams,
  options?: ListQueryOptions<TData, TKey>,
) => UseQueryResult<TData, unknown>;

const createListQuery = <TData, TParams, TKey extends AnyKey>(
  path: string,
  keyFactory: KeyFactory<TParams, TKey>,
): ListQueryHook<TData, TParams, TKey> => {
  return (params, options) =>
    useQuery({
      queryKey: keyFactory(params),
      queryFn: async () => {
        const { data } = await api.get<TData>(path, { params });
        return data;
      },
      retry: 1,
      staleTime: 30_000,
      placeholderData: keepPreviousData,

      ...options,
    });
};

export const useTermsQuery = createListQuery<
  TermListResponse,
  TermQueryParams,
  ReturnType<typeof queryKeys.terms.list>
>("/terms/", queryKeys.terms.list);

export const useRoomsQuery = createListQuery<
  RoomListResponse,
  RoomQueryParams,
  ReturnType<typeof queryKeys.rooms.list>
>("/rooms/", queryKeys.rooms.list);

export const useExamsQuery = createListQuery<
  ExamListResponse,
  ExamQueryParams,
  ReturnType<typeof queryKeys.exams.list>
>("/exams/", queryKeys.exams.list);

export const useAllocationsQuery = createListQuery<
  AllocationListResponse,
  AllocationQueryParams,
  ReturnType<typeof queryKeys.allocations.list>
>("/allocations/", queryKeys.allocations.list);

export const useBlackoutsQuery = createListQuery<
  BlackoutListResponse,
  BlackoutQueryParams,
  ReturnType<typeof queryKeys.blackouts.list>
>("/blackouts/", queryKeys.blackouts.list);

export const useHolidaysQuery = createListQuery<
  HolidayListResponse,
  HolidayQueryParams,
  ReturnType<typeof queryKeys.holidays.list>
>("/holidays/", queryKeys.holidays.list);

export const usePublicExamsQuery = createListQuery<
  PublicExamListResponse,
  PublicExamQueryParams,
  ReturnType<typeof queryKeys.publicExams.list>
>("/public/exams/", queryKeys.publicExams.list);

export const useExamOwnersQuery = () =>
  useQuery({
    queryKey: queryKeys.exams.owners(),
    queryFn: async () => {
      const { data } = await api.get<ExamOwnerListResponse>("/exams/owners/");
      return data;
    },
    staleTime: 5 * 60_000,
  });
