import { getAvailabilityList } from "@/lib/actions/circles";
import { AvailabilityList } from "@/components/circles/availability-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CalendarPage() {
  const properties = await getAvailabilityList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Availability across your properties and Circle network
        </p>
      </div>

      <AvailabilityList properties={properties} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Coming soon</CardTitle>
          <CardDescription>
            Full calendar sync with Zodomus channel manager will replace mock
            availability dates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Open dates shown above are placeholder data for Phase 1.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
