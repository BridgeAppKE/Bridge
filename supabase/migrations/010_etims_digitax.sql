-- DigiTax / eTIMS invoice metadata

alter table public.invoices
  add column if not exists etims_internal_data text,
  add column if not exists etims_receipt_signature text,
  add column if not exists etims_qr_payload text,
  add column if not exists etims_cu_serial text,
  add column if not exists digitax_invoice_id text,
  add column if not exists filed_at timestamptz;
