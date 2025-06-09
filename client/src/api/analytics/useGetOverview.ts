import { useQuery } from "@tanstack/react-query";
import { useStore } from "../../lib/store";
import { authedFetch, getStartAndEndDate } from "../utils";
import { timeZone } from "../../lib/dateTimeUtils";

export type GetOverviewResponse = {
  sessions: number;
  pageviews: number;
  users: number;
  pages_per_session: number;
  bounce_rate: number;
  session_duration: number;
};

type PeriodTime = "current" | "previous";

export function useGetOverview({
  periodTime,
  site,
}: {
  periodTime?: PeriodTime;
  site?: number | string;
}) {
  const { time, previousTime, filters } = useStore();
  const timeToUse = periodTime === "previous" ? previousTime : time;
  const { startDate, endDate } = getStartAndEndDate(timeToUse);

  return useQuery({
    queryKey: ["overview", timeToUse, site, filters],
    queryFn: () => {
      return authedFetch<{ data: GetOverviewResponse }>(`/overview/${site}`, {
        startDate,
        endDate,
        timeZone,
        filters,
      });
    },
    staleTime: Infinity,
    placeholderData: (_, query: any) => {
      if (!query?.queryKey) return undefined;
      const prevQueryKey = query.queryKey as [string, string, string];
      const [, , prevSite] = prevQueryKey;

      if (prevSite === site) {
        return query.state.data;
      }
      return undefined;
    },
  });
}

export function useGetOverviewPastMinutes({
  pastMinutesStart,
  pastMinutesEnd,
  site,
}: {
  pastMinutesStart: number;
  pastMinutesEnd: number;
  site?: number | string;
}) {
  return useQuery({
    queryKey: ["overview-past-minutes", pastMinutesStart, pastMinutesEnd, site],
    queryFn: () => {
      return authedFetch<{ data: GetOverviewResponse }>(`/overview/${site}`, {
        timeZone,
        pastMinutesStart,
        pastMinutesEnd,
      });
    },
    staleTime: Infinity,
    placeholderData: (_, query: any) => {
      if (!query?.queryKey) return undefined;
      const prevQueryKey = query.queryKey as [string, string, string];
      const [, , prevSite] = prevQueryKey;

      if (prevSite === site) {
        return query.state.data;
      }
      return undefined;
    },
  });
}
