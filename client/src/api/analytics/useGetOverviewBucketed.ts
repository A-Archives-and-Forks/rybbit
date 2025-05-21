import {
  UseQueryOptions,
  UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { Filter, TimeBucket, useStore } from "../../lib/store";
import { timeZone } from "../../lib/dateTimeUtils";
import { APIResponse } from "../types";
import { authedFetch, getStartAndEndDate } from "../utils";

type PeriodTime = "current" | "previous";

export type GetOverviewBucketedResponse = {
  time: string;
  pageviews: number;
  sessions: number;
  pages_per_session: number;
  bounce_rate: number;
  session_duration: number;
  users: number;
}[];

export function useGetOverviewBucketed({
  periodTime,
  site: propSite,
  bucket = "hour",
  dynamicFilters = [],
  props,
}: {
  periodTime?: PeriodTime;
  site?: number | string;
  bucket?: TimeBucket;
  dynamicFilters?: Filter[];
  props?: Partial<UseQueryOptions<APIResponse<GetOverviewBucketedResponse>>>;
}): UseQueryResult<APIResponse<GetOverviewBucketedResponse>> {
  const {
    time,
    previousTime,
    filters: globalFilters,
    site: storeSite,
  } = useStore();
  const siteToUse = propSite !== undefined ? propSite : storeSite;

  const timeToUse = periodTime === "previous" ? previousTime : time;

  const { startDate, endDate } = getStartAndEndDate(timeToUse);

  const combinedFilters = [...globalFilters, ...dynamicFilters];

  return useQuery({
    queryKey: [
      "overview-bucketed",
      timeToUse,
      bucket,
      siteToUse,
      combinedFilters,
    ],
    queryFn: () => {
      return authedFetch(`${BACKEND_URL}/overview-bucketed/${siteToUse}`, {
        startDate,
        endDate,
        timeZone,
        bucket,
        filters: combinedFilters,
      }).then((res) => res.json());
    },
    placeholderData: (_, query: any) => {
      if (!query?.queryKey) return undefined;
      const [, , , prevSite] = query.queryKey as [
        string,
        any,
        TimeBucket,
        string | number,
        Filter[]
      ];

      if (prevSite === siteToUse) {
        return query.state.data;
      }
      return undefined;
    },
    staleTime: Infinity,
    ...props,
  });
}

export function useGetOverviewBucketedPastMinutes({
  pastMinutes = 24 * 60,
  pastMinutesStart,
  pastMinutesEnd,
  site: propSite,
  bucket = "hour",
  refetchInterval,
  dynamicFilters = [],
  props,
}: {
  pastMinutes?: number;
  pastMinutesStart?: number;
  pastMinutesEnd?: number;
  site?: number | string;
  bucket?: TimeBucket;
  refetchInterval?: number;
  dynamicFilters?: Filter[];
  props?: Partial<UseQueryOptions<APIResponse<GetOverviewBucketedResponse>>>;
}): UseQueryResult<APIResponse<GetOverviewBucketedResponse>> {
  const { filters: globalFilters, site: storeSite } = useStore();
  const siteToUse = propSite !== undefined ? propSite : storeSite;

  const combinedFilters = [...globalFilters, ...dynamicFilters];

  const useRange =
    pastMinutesStart !== undefined && pastMinutesEnd !== undefined;

  return useQuery({
    queryKey: useRange
      ? [
          "overview-bucketed-past-minutes-range",
          pastMinutesStart,
          pastMinutesEnd,
          siteToUse,
          bucket,
          combinedFilters,
        ]
      : [
          "overview-bucketed-past-minutes",
          pastMinutes,
          siteToUse,
          bucket,
          combinedFilters,
        ],
    queryFn: () => {
      return authedFetch(
        `${BACKEND_URL}/overview-bucketed/${siteToUse}`,
        useRange
          ? {
              timeZone,
              bucket,
              pastMinutesStart,
              pastMinutesEnd,
              filters: combinedFilters,
            }
          : {
              timeZone,
              bucket,
              pastMinutes,
              filters: combinedFilters,
            }
      ).then((res) => res.json());
    },
    refetchInterval,
    placeholderData: (_, query: any) => {
      if (!query?.queryKey) return undefined;
      const [, , prevSite] = query.queryKey as [
        string,
        any,
        string | number,
        TimeBucket,
        Filter[]
      ];
      if (prevSite === siteToUse) {
        return query.state.data;
      }
      return undefined;
    },
    staleTime: Infinity,
    ...props,
  });
}

/**
 * Hook to get previous time period data for comparison with last-24-hours mode
 */
export function useGetOverviewBucketedPreviousPastMinutes({
  pastMinutes = 24 * 60,
  site: propSite,
  bucket = "hour",
  refetchInterval,
  dynamicFilters = [],
  props,
}: {
  pastMinutes?: number;
  site?: number | string;
  bucket?: TimeBucket;
  refetchInterval?: number;
  dynamicFilters?: Filter[];
  props?: Partial<UseQueryOptions<APIResponse<GetOverviewBucketedResponse>>>;
}): UseQueryResult<APIResponse<GetOverviewBucketedResponse>> {
  const { filters: globalFilters, site: storeSite } = useStore();
  const siteToUse = propSite !== undefined ? propSite : storeSite;

  const combinedFilters = [...globalFilters, ...dynamicFilters];

  const pastMinutesStartVal = pastMinutes * 2;
  const pastMinutesEndVal = pastMinutes;

  return useQuery({
    queryKey: [
      "overview-bucketed-previous-past-minutes",
      pastMinutesStartVal,
      pastMinutesEndVal,
      siteToUse,
      bucket,
      combinedFilters,
    ],
    queryFn: () => {
      return authedFetch(`${BACKEND_URL}/overview-bucketed/${siteToUse}`, {
        timeZone,
        bucket,
        pastMinutesStart: pastMinutesStartVal,
        pastMinutesEnd: pastMinutesEndVal,
        filters: combinedFilters,
      }).then((res) => res.json());
    },
    refetchInterval,
    placeholderData: (_, query: any) => {
      if (!query?.queryKey) return undefined;
      const [, , , prevSite] = query.queryKey as [
        string,
        number,
        number,
        string | number,
        TimeBucket,
        Filter[]
      ];
      if (prevSite === siteToUse) {
        return query.state.data;
      }
      return undefined;
    },
    staleTime: Infinity,
    ...props,
  });
}
