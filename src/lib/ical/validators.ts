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
