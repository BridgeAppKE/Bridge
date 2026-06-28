"use server";

import { revalidatePath } from "next/cache";
import { createDataClient, getSessionUser } from "@/lib/supabase/server";
import { STATUS_CYCLE } from "@/lib/operations/constants";
import type { OperationalTask } from "@/lib/types/database";

export type TaskWithProperty = OperationalTask & {
  properties: { name: string } | null;
};

export async function getOperationalTasks(
  propertyIdOrStatus?: string | OperationalTask["status"],
  status?: OperationalTask["status"]
): Promise<TaskWithProperty[]> {
  const supabase = await createDataClient();
  const user = await getSessionUser();
  if (!user) return [];

  let propertyId: string | undefined;
  let statusFilter = status;

  if (
    propertyIdOrStatus === "pending" ||
    propertyIdOrStatus === "in_progress" ||
    propertyIdOrStatus === "completed"
  ) {
    statusFilter = propertyIdOrStatus;
  } else if (propertyIdOrStatus) {
    propertyId = propertyIdOrStatus;
  }

  let query = supabase
    .from("operational_tasks")
    .select("*, properties(name)")
    .order("created_at", { ascending: false });

  if (propertyId) query = query.eq("property_id", propertyId);
  if (statusFilter) query = query.eq("status", statusFilter);

  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01") return [];
    throw new Error(error.message);
  }

  return (data ?? []) as TaskWithProperty[];
}

export async function getLatestActiveTask(): Promise<TaskWithProperty | null> {
  const tasks = await getOperationalTasks();
  return (
    tasks.find((t) => t.status === "in_progress" || t.status === "pending") ?? null
  );
}

export async function createOperationalTask(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const propertyId = formData.get("property_id") as string;
  const title = (formData.get("title") as string)?.trim();
  const dueAt = (formData.get("due_at") as string) || null;
  const taskType = (formData.get("task_type") as string) || "Other";

  if (!propertyId || !title) {
    return { error: "Property and task title are required." };
  }

  const supabase = await createDataClient();
  const { error } = await supabase.from("operational_tasks").insert({
    property_id: propertyId,
    title,
    due_at: dueAt,
    task_type: taskType,
    status: "pending",
  });

  if (error) {
    if (error.code === "42P01") {
      return { error: "Run migration 007_operations.sql" };
    }
    return { error: error.message };
  }

  revalidatePath("/operations");
  revalidatePath("/unit");
  revalidatePath("/home");
  return { success: true };
}

export async function updateTaskStatus(
  taskId: string,
  status?: OperationalTask["status"]
) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();

  let nextStatus = status;
  if (!nextStatus) {
    const { data: task } = await supabase
      .from("operational_tasks")
      .select("status")
      .eq("id", taskId)
      .maybeSingle();
    const currentIndex = STATUS_CYCLE.indexOf(
      (task?.status as (typeof STATUS_CYCLE)[number]) ?? "pending"
    );
    nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
  }

  const { error } = await supabase
    .from("operational_tasks")
    .update({
      status: nextStatus,
      completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath("/operations");
  revalidatePath("/unit");
  revalidatePath("/home");
  return { success: true, status: nextStatus };
}

export async function deleteTask(taskId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();
  const { error } = await supabase.from("operational_tasks").delete().eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/operations");
  revalidatePath("/unit");
  return { success: true };
}

/** Auto-create a cleaning task when a guest checks out (section 5a). */
export async function createCheckoutCleaningTask(
  propertyId: string,
  bookingId: string,
  guestName: string | null,
  checkoutDate: string,
  nextCheckIn: string | null
) {
  const supabase = await createDataClient();

  const dueAt = new Date(`${checkoutDate}T12:00:00`).toISOString();
  const note = `Guest checkout${guestName ? ` — ${guestName}` : ""}. Next check-in: ${
    nextCheckIn
      ? new Date(nextCheckIn).toLocaleDateString("en-KE", { month: "short", day: "numeric" })
      : "None scheduled"
  }`;

  const { error } = await supabase.from("operational_tasks").insert({
    property_id: propertyId,
    booking_id: bookingId,
    title: note,
    task_type: "Cleaning",
    due_at: dueAt,
    status: "pending",
  });

  if (error && error.code !== "42P01") {
    return { error: error.message };
  }

  revalidatePath("/operations");
  revalidatePath("/unit");
  revalidatePath("/home");
  return { success: true };
}

export async function completeTask(taskId: string, proofPath?: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();
  const { error } = await supabase
    .from("operational_tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) return { error: error.message };

  if (proofPath) {
    await supabase.from("task_proofs").insert({
      task_id: taskId,
      storage_path: proofPath,
      uploaded_by: user.id,
    });
  }

  revalidatePath("/operations");
  revalidatePath("/unit");
  revalidatePath("/home");
  return { success: true };
}

export async function uploadTaskProof(formData: FormData) {
  const file = formData.get("file") as File;
  const taskId = formData.get("task_id") as string;

  if (!file?.size || !taskId) return { error: "File and task required" };

  const user = await getSessionUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createDataClient();
  const path = `${user.id}/${taskId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from("task-proofs")
    .upload(path, file, { upsert: false });

  if (error) return { error: error.message };

  return completeTask(taskId, path);
}
