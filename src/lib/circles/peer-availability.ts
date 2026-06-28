export type PeerAvailabilityRow = {
  property_id: string;
  property_name: string;
  host_id: string;
  host_name: string;
  location: string | null;
  base_rate_kes: number;
  bedrooms: number;
  is_own: boolean;
  is_available: boolean;
};

export type CircleMemberDisplay = {
  id: string;
  name: string;
  status: string;
  unitsAvailable: number;
};

/** Group flat search rows into home Circles tile (same peers as Circles tab). */
export function groupPeerAvailabilityForHome(
  rows: PeerAvailabilityRow[]
): CircleMemberDisplay[] {
  const byHost = new Map<
    string,
    { id: string; name: string; units: number; minRate: number; location: string | null }
  >();

  for (const row of rows) {
    if (row.is_own || !row.is_available) continue;
    const existing = byHost.get(row.host_id);
    if (existing) {
      existing.units += 1;
      existing.minRate = Math.min(existing.minRate, row.base_rate_kes);
      if (!existing.location && row.location) existing.location = row.location;
    } else {
      byHost.set(row.host_id, {
        id: row.host_id,
        name: row.host_name,
        units: 1,
        minRate: row.base_rate_kes,
        location: row.location,
      });
    }
  }

  return Array.from(byHost.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((host) => ({
      id: host.id,
      name: host.name,
      unitsAvailable: host.units,
      status: [
        `KES ${host.minRate.toLocaleString()}/night`,
        host.location,
        `${host.units} unit${host.units === 1 ? "" : "s"} free`,
      ]
        .filter(Boolean)
        .join(" · "),
    }));
}
