"use server";

import { createDataClient, getSessionUser } from "@/lib/supabase/server";

const OCR_MONTHLY_LIMIT = 10;

export async function getReceiptOcrQuota(): Promise<{
  used: number;
  limit: number;
  remaining: number;
}> {
  const user = await getSessionUser();
  if (!user) return { used: 0, limit: OCR_MONTHLY_LIMIT, remaining: OCR_MONTHLY_LIMIT };

  const supabase = await createDataClient();
  const { data } = await supabase
    .from("profiles")
    .select("receipt_ocr_used_this_month, receipt_ocr_reset_at")
    .eq("id", user.id)
    .maybeSingle();

  let used = Number(data?.receipt_ocr_used_this_month ?? 0);
  const resetAt = data?.receipt_ocr_reset_at
    ? new Date(data.receipt_ocr_reset_at)
    : null;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  if (resetAt && resetAt < monthStart) {
    used = 0;
    await supabase
      .from("profiles")
      .update({
        receipt_ocr_used_this_month: 0,
        receipt_ocr_reset_at: monthStart.toISOString(),
      })
      .eq("id", user.id);
  }

  return {
    used,
    limit: OCR_MONTHLY_LIMIT,
    remaining: Math.max(0, OCR_MONTHLY_LIMIT - used),
  };
}

export async function consumeReceiptOcrCredit(): Promise<{ ok: boolean; remaining: number }> {
  const quota = await getReceiptOcrQuota();
  if (quota.remaining <= 0) {
    return { ok: false, remaining: 0 };
  }

  const user = await getSessionUser();
  if (!user) return { ok: false, remaining: 0 };

  const supabase = await createDataClient();
  const nextUsed = quota.used + 1;
  await supabase
    .from("profiles")
    .update({ receipt_ocr_used_this_month: nextUsed })
    .eq("id", user.id);

  return { ok: true, remaining: quota.remaining - 1 };
}
