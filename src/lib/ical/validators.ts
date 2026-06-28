export const AIRBNB_ICAL_PREFIX = "https://ical.airbnb.com/";

export function validateAirbnbIcalUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return "Please paste your Airbnb calendar link.";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return "Please ensure this is a valid Airbnb export link.";
    }
    if (!parsed.href.startsWith(AIRBNB_ICAL_PREFIX)) {
      return "Please ensure this is a valid Airbnb export link.";
    }
  } catch {
    return "Please ensure this is a valid Airbnb export link.";
  }
  return null;
}

export function validateBookingComIcalUrl(url: string): string | null {
  const trimmed = url.trim().replace(/^webcal:/, "https:");
  if (!trimmed) return "Please paste your Booking.com export link.";
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const ok =
      host.includes("booking.com") ||
      host.includes("admin.booking.com") ||
      parsed.pathname.endsWith(".ics");
    if (!ok) {
      return "Paste the .ics export link from Booking.com Extranet.";
    }
  } catch {
    return "Please ensure this is a valid Booking.com calendar link.";
  }
  return null;
}

export function validateIcalUrl(url: string, platform: string): string | null {
  if (platform === "Booking.com") return validateBookingComIcalUrl(url);
  if (platform === "Airbnb") return validateAirbnbIcalUrl(url);
  if (!url.trim()) return "Please paste a calendar export link.";
  try {
    new URL(url.trim().replace(/^webcal:/, "https:"));
  } catch {
    return "Invalid calendar URL.";
  }
  return null;
}

export function supportWhatsAppUrl(message: string) {
  const number = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, "");
  const text = encodeURIComponent(message);
  if (number) return `https://wa.me/${number}?text=${text}`;
  return `https://wa.me/?text=${text}`;
}

export function circleInviteWhatsAppUrl(code: string, hostName: string) {
  const text = `Join my EliteHost Circle! ${hostName}'s invite code: ${code}`;
  return supportWhatsAppUrl(text);
}
