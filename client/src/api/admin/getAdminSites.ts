import { useQuery } from "@tanstack/react-query";
import { authedFetchWithError } from "../utils";

export interface AdminSiteData {
  siteId: number;
  domain: string;
  createdAt: string;
  public: boolean;
  eventsLast24Hours: number;
  organizationOwnerEmail: string | null;
}

export async function getAdminSites() {
  return authedFetchWithError<AdminSiteData[]>("/admin/sites");
}

export function useAdminSites() {
  return useQuery<AdminSiteData[]>({
    queryKey: ["admin-sites"],
    queryFn: getAdminSites,
  });
}
