"use client";

import { useState, useTransition } from "react";
import { createOperationalTask } from "@/lib/actions/operations";
import type { TaskWithProperty } from "@/lib/actions/operations";
import type { Property } from "@/lib/types/database";
import { SectionHeader } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface OperationsClientProps {
  properties: Property[];
  tasks: TaskWithProperty[];
}

export function OperationsClient({ properties, tasks }: OperationsClientProps) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    formData.set("property_id", propertyId);
    startTransition(async () => {
      await createOperationalTask(formData);
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader
          title="Create task"
          description="Assign turnover, cleaning, or maintenance work tied to a unit."
        />
        {properties.length > 0 ? (
          <form action={handleCreate} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={propertyId} onValueChange={(v) => v && setPropertyId(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-title">Task</Label>
              <Input id="task-title" name="title" placeholder="Turnover clean" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="due-at">Due (optional)</Label>
              <Input id="due-at" name="due_at" type="datetime-local" />
            </div>
            <Button type="submit" disabled={isPending} className="sm:col-span-2">
              Create task
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">Add a unit first.</p>
        )}
      </div>

      <div>
        <SectionHeader title="Active tasks" description="Staff dispatch queue" />
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.properties?.name ?? "Unit"}
                    {task.due_at &&
                      ` · Due ${new Date(task.due_at).toLocaleString("en-KE")}`}
                  </p>
                </div>
                <Badge
                  variant={task.status === "completed" ? "default" : "secondary"}
                >
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
