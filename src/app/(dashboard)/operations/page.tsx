import { PageShell, GlassSection } from "@/components/layout/page-shell";
import { getOperationalTasks } from "@/lib/actions/operations";
import {
  ensureDefaultProperty,
  getUserProperties,
} from "@/lib/actions/properties";
import { OperationsClient } from "@/components/operations/operations-client";

export default async function OperationsPage() {
  await ensureDefaultProperty();
  const [properties, tasks] = await Promise.all([
    getUserProperties(),
    getOperationalTasks(),
  ]);

  return (
    <PageShell
      title="Operations"
      subtitle="Staff tasks, turnover dispatch, and photo proof"
    >
      <GlassSection>
        <OperationsClient properties={properties} tasks={tasks} />
      </GlassSection>
    </PageShell>
  );
}
