import { Filter } from "@rybbit/shared";
import { useQuery } from "@tanstack/react-query";
import { timeZone } from "../../lib/dateTimeUtils";
import { useStore } from "../../lib/store";
import { authedFetchWithError } from "../utils";
import { Goal } from "./useGetGoals";

interface GetGoalResponse {
  data: Goal;
}

export function useGetGoal({
  goalId,
  startDate,
  endDate,
  filters,
  enabled = true,
}: {
  goalId: number;
  startDate: string;
  endDate: string;
  filters?: Filter[];
  enabled?: boolean;
}) {
  const { site } = useStore();

  return useQuery({
    queryKey: ["goal", site, goalId, startDate, endDate, timeZone, filters],
    queryFn: async () => {
      return authedFetchWithError<GetGoalResponse>(`/goal/${goalId}/${site}`, {
        startDate,
        endDate,
        timeZone,
        filters,
      });
    },
    enabled: !!site && !!goalId && enabled,
  });
}
