import type { AvailabilityProperty } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AvailabilityListProps {
  properties: AvailabilityProperty[];
}

export function AvailabilityList({ properties }: AvailabilityListProps) {
  if (!properties.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Availability</CardTitle>
          <CardDescription>
            Add properties or connect with Circle members to see availability.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Combined Availability</CardTitle>
        <CardDescription>
          Your properties and Circle members&apos; listings (mock calendar data)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {properties.map((property) => (
          <div
            key={property.id}
            className="rounded-lg border p-3"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{property.name}</p>
                <p className="text-xs text-muted-foreground">
                  {property.is_own
                    ? "Your property"
                    : `Circle · ${property.owner_name ?? "Host"}`}
                </p>
              </div>
              {property.is_own && (
                <Badge variant="outline" className="shrink-0 border-emerald-200 text-emerald-700">
                  Yours
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {property.mock_availability.map((date) => (
                <Badge
                  key={date}
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-800"
                >
                  Open · {date}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
