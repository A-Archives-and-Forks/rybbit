import { Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { authClient } from "../lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function OrganizationSelector() {
  const { data: organizations } = authClient.useListOrganizations();
  const { data: activeOrganization, isPending } =
    authClient.useActiveOrganization();

  // Local state to handle the delay when switching organizations
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Update local state when activeOrganization changes
  useEffect(() => {
    if (activeOrganization?.id) {
      setSelectedOrgId(activeOrganization.id);
    }
  }, [activeOrganization?.id]);

  const handleValueChange = (organizationId: string) => {
    // Update local state immediately for responsive UI
    setSelectedOrgId(organizationId);
    // Then update the actual active organization
    authClient.organization.setActive({
      organizationId,
    });
  };

  // Show placeholder when loading or no active organization
  if (isPending || !activeOrganization) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={isPending ? "Loading..." : "Select an organization"}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="placeholder" disabled>
            {isPending
              ? "Loading organizations..."
              : "No organization selected"}
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select
      value={selectedOrgId || activeOrganization?.id}
      onValueChange={handleValueChange}
      disabled={!organizations || organizations.length === 0}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an organization" />
      </SelectTrigger>
      <SelectContent>
        {organizations?.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            <div className="flex items-center">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              {org.name}
            </div>
          </SelectItem>
        ))}
        {(!organizations || organizations.length === 0) && (
          <SelectItem value="no-org" disabled>
            No organizations available
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
