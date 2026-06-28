import { Badge } from "@/components/ui/badge";
import { SectionHeader, listRowClass } from "@/components/layout/page-shell";
import { cn } from "@/lib/utils";

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
      <SectionHeader
        title="Stock Levels"
        description="No inventory rules yet."
      />
    );
  }

  return (
    <div>
      <SectionHeader
        title="Stock Levels"
        description="Current consumables across units"
      />
      <div className="space-y-3">
        {rules.map((rule) => {
          const isLow = rule.current_stock <= rule.alert_threshold;
          return (
            <div
              key={rule.id}
              className={cn(listRowClass, "flex items-center justify-between")}
            >
              <div>
                <p className="font-medium text-foreground">{rule.item_name}</p>
                <p className="text-xs text-muted-foreground">
                  {rule.properties?.name} · {rule.usage_per_guest}/guest
                </p>
              </div>
              <div className="text-right">
                <p className={cn("font-semibold tabular-nums", isLow && "text-destructive")}>
                  {rule.current_stock}
                </p>
                {isLow && (
                  <Badge variant="destructive" className="mt-1 text-xs">
                    Low stock
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
