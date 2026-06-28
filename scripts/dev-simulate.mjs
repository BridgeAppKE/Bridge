const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const secret = process.env.CRON_SECRET;

const headers = secret ? { Authorization: `Bearer ${secret}` } : {};

const res = await fetch(`${base}/api/cron/dev-simulate`, { headers });
const data = await res.json();
console.log(res.ok ? data : data.error ?? data);
