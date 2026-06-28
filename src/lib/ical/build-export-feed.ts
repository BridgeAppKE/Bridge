import ical from "ical-generator";

export type ExportBooking = {
  id: string;
  start_date: string;
  end_date: string;
  is_manual_block: boolean;
};

export function buildExportFeed(
  unitName: string,
  bookings: ExportBooking[]
): string {
  const calendar = ical({
    name: `EliteHost · ${unitName}`,
    prodId: { company: "EliteHost", product: "Calendar Export" },
  });

  for (const booking of bookings) {
    const start = new Date(`${booking.start_date}T00:00:00Z`);
    const end = new Date(`${booking.end_date}T00:00:00Z`);
    calendar.createEvent({
      id: booking.id,
      start,
      end,
      summary: booking.is_manual_block ? "Blocked" : "Reserved",
    });
  }

  return calendar.toString();
}
