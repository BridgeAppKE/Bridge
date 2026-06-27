import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type InventoryRuleWithProperty = {
  id: string;
  item_name: string;
  usage_per_guest: number;
  current_stock: number;
  alert_threshold: number;
  properties: { name: string } | null;
};

interface InventoryListProps {
  rules: InventoryRuleWithProperty[];
}

export function InventoryList({ rules }: InventoryListProps) {
  if (!rules.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stock Levels</CardTitle>
          <CardDescription>No inventory rules yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Stock Levels</CardTitle>
        <CardDescription>Current consumables across properties</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rules.map((rule) => {
          const isLow = rule.current_stock <= rule.alert_threshold;
          return (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{rule.item_name}</p>
                <p className="text-xs text-muted-foreground">
                  {rule.properties?.name} · {rule.usage_per_guest}/guest
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">{rule.current_stock}</p>
                {isLow && (
                  <Badge variant="destructive" className="mt-1 text-xs">
                    Low stock
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
