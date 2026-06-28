const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const res = await fetch(`${base}/api/dev/seed`, { method: "POST" });
const data = await res.json();
console.log(res.ok ? data : data.error ?? data);
