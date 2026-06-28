"use client";

import { useState, useTransition } from "react";
import { createOperationalTask, updateTaskStatus, TASK_TYPES } from "@/lib/actions/operations";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OperationsClientProps {
  properties: Property[];
  tasks: TaskWithProperty[];
  defaultPropertyId?: string;
}

export function OperationsClient({
  properties,
  tasks,
  defaultPropertyId,
}: OperationsClientProps) {
  const [propertyId, setPropertyId] = useState(
    defaultPropertyId ?? properties[0]?.id ?? ""
  );
  const [taskType, setTaskType] = useState<string>("Cleaning");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCreate(formData: FormData) {
    formData.set("property_id", propertyId);
    formData.set("task_type", taskType);
    startTransition(async () => {
      await createOperationalTask(formData);
      router.refresh();
    });
  }

  function cycleStatus(taskId: string) {
    startTransition(async () => {
      const result = await updateTaskStatus(taskId);
      if (result.error) toast.error(result.error);
      else router.refresh();
    });
  }

  function notifyCleaner(task: TaskWithProperty) {
    const property = properties.find((p) => p.id === task.property_id);
    const phone = (property as Property & { cleaner_phone?: string | null })?.cleaner_phone;
    if (!phone) {
      toast.error("Add a cleaner phone number for this unit first.");
      return;
    }
    const text = encodeURIComponent(
      `Hi, ${property?.name ?? "the unit"} needs cleaning. ${task.title}. Please confirm.`
    );
    window.open(`https://wa.me/${phone.replace(/[^\d]/g, "")}?text=${text}`, "_blank");
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
              <Label>Type</Label>
              <Select value={taskType} onValueChange={(v) => v && setTaskType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
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
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{(task as TaskWithProperty & { task_type?: string }).task_type ?? "Other"}</Badge>
                    <p className="font-medium">{task.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {task.properties?.name ?? "Unit"}
                    {task.due_at &&
                      ` · Due ${new Date(task.due_at).toLocaleString("en-KE")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(task as TaskWithProperty & { task_type?: string }).task_type === "Cleaning" &&
                    task.status !== "completed" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => notifyCleaner(task)}
                      >
                        Notify cleaner via WhatsApp
                      </Button>
                    )}
                  <Badge
                    variant={task.status === "completed" ? "default" : "secondary"}
                    className="cursor-pointer tap-scale"
                    onClick={() => cycleStatus(task.id)}
                  >
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
