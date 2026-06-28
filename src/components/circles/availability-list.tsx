import type { AvailabilityProperty } from "@/lib/types/database";
import { SectionHeader, listRowClass } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";

interface AvailabilityListProps {
  properties: AvailabilityProperty[];
}

export function AvailabilityList({ properties }: AvailabilityListProps) {
  if (!properties.length) {
    return (
      <SectionHeader
        title="Availability"
        description="Add units or connect with Circle members to see availability."
      />
    );
  }

  return (
    <div>
      <SectionHeader
        title="Combined Availability"
        description="Your units and Circle members' listings from synced bookings"
      />
      <div className="space-y-3">
        {properties.map((property) => (
          <div key={property.id} className={listRowClass}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-foreground">{property.name}</p>
                <p className="text-xs text-muted-foreground">
                  {property.is_own
                    ? "Your unit"
                    : `Circle · ${property.owner_name ?? "Host"}`}
                </p>
              </div>
              {property.is_own && (
                <Badge variant="outline" className="shrink-0">
                  Yours
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {property.mock_availability.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
