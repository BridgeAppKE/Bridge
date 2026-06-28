export const DEV_HOST_UNITS = [
  { name: "Kilimani Loft", location: "Kilimani, Nairobi", bedrooms: 1, baseRate: 9500 },
  { name: "Karen Cottage", location: "Karen, Nairobi", bedrooms: 3, baseRate: 18000 },
  { name: "Nyali Beach Flat", location: "Nyali, Mombasa", bedrooms: 2, baseRate: 12500 },
  { name: "Westlands Studio", location: "Westlands, Nairobi", bedrooms: 1, baseRate: 8500 },
] as const;

export const DEMO_PEERS = [
  {
    hostName: "Amina O.",
    units: [{ name: "Lavington Suite", location: "Lavington", bedrooms: 2, baseRate: 14000 }],
  },
  {
    hostName: "James K.",
    units: [
      { name: "Runda Villa", location: "Runda", bedrooms: 4, baseRate: 28000 },
      { name: "Gigiri Annex", location: "Gigiri", bedrooms: 2, baseRate: 16000 },
    ],
  },
  {
    hostName: "Fatima M.",
    units: [{ name: "Diani Palm House", location: "Diani", bedrooms: 3, baseRate: 22000 }],
  },
  {
    hostName: "Peter W.",
    units: [{ name: "Ngong Hills Cabin", location: "Ngong", bedrooms: 2, baseRate: 11000 }],
  },
  {
    hostName: "Grace N.",
    units: [
      { name: "Thika Road Apt", location: "Ruiru", bedrooms: 1, baseRate: 7500 },
      { name: "Muthaiga Guest Wing", location: "Muthaiga", bedrooms: 2, baseRate: 19000 },
    ],
  },
  {
    hostName: "Omar H.",
    units: [{ name: "Nakuru Lake View", location: "Nakuru", bedrooms: 2, baseRate: 9000 }],
  },
] as const;

export const DEMO_EXPENSE_VENDORS = [
  "Naivas",
  "Carrefour",
  "Quickmart",
  "CleanPro Services",
  "Kenya Power",
  "Nairobi Water",
  "Jumia",
  "Zucchini Greengrocers",
  "Uber Eats",
] as const;

/** Per-unit stock — mix of healthy and low items (quantity, alert_threshold). */
export const UNIT_INVENTORY_PROFILES: Record<
  string,
  { name: string; quantity: number; alert_threshold: number }[]
> = {
  "Kilimani Loft": [
    { name: "Toilet paper", quantity: 2, alert_threshold: 4 },
    { name: "Hand soap", quantity: 5, alert_threshold: 2 },
    { name: "Towels", quantity: 12, alert_threshold: 6 },
    { name: "Coffee pods", quantity: 18, alert_threshold: 8 },
    { name: "Trash bags", quantity: 8, alert_threshold: 4 },
    { name: "Dish sponge", quantity: 3, alert_threshold: 2 },
  ],
  "Karen Cottage": [
    { name: "Toilet paper", quantity: 14, alert_threshold: 6 },
    { name: "Hand soap", quantity: 4, alert_threshold: 3 },
    { name: "Towels", quantity: 24, alert_threshold: 10 },
    { name: "Coffee pods", quantity: 6, alert_threshold: 10 },
    { name: "Trash bags", quantity: 15, alert_threshold: 5 },
    { name: "Laundry pods", quantity: 2, alert_threshold: 4 },
  ],
  "Nyali Beach Flat": [
    { name: "Toilet paper", quantity: 9, alert_threshold: 5 },
    { name: "Hand soap", quantity: 1, alert_threshold: 2 },
    { name: "Beach towels", quantity: 10, alert_threshold: 6 },
    { name: "Sunscreen (guest)", quantity: 4, alert_threshold: 2 },
    { name: "Trash bags", quantity: 7, alert_threshold: 4 },
  ],
  "Westlands Studio": [
    { name: "Toilet paper", quantity: 6, alert_threshold: 4 },
    { name: "Hand soap", quantity: 3, alert_threshold: 2 },
    { name: "Towels", quantity: 8, alert_threshold: 4 },
    { name: "Coffee pods", quantity: 3, alert_threshold: 6 },
    { name: "Water bottles (1L)", quantity: 2, alert_threshold: 6 },
  ],
};

export const DEMO_TASK_TITLES = [
  "Turnover clean — guest checkout 11am",
  "Laundry run — bed linens",
  "Fix leaking kitchen tap",
  "Deep clean after long stay",
  "Restock welcome basket",
  "AC filter replacement",
] as const;

/** [startOffsetDays, endOffsetDays, isBlock] from today */
export type BookingSlot = [number, number, boolean?];

export const HOST_BOOKING_SCHEDULES: Record<string, BookingSlot[]> = {
  "Kilimani Loft": [
    [-52, -48],
    [-38, -35],
    [-24, -20],
    [-12, -9],
    [-4, -2],
    [2, 5],
    [11, 14],
    [22, 24, true],
    [31, 36],
  ],
  "Karen Cottage": [
    [-45, -40],
    [-28, -22],
    [-15, -11],
    [-6, -3],
    [4, 9],
    [16, 21],
    [28, 32],
    [35, 38, true],
  ],
  "Nyali Beach Flat": [
    [-50, -46],
    [-33, -29],
    [-19, -14],
    [-8, -5],
    [6, 11],
    [15, 19],
    [26, 30],
    [40, 45],
  ],
  "Westlands Studio": [
    [-41, -39],
    [-27, -24],
    [-17, -13],
    [-7, -4],
    [3, 6],
    [9, 12],
    [18, 20, true],
    [27, 31],
  ],
};

/** Peer property bookings — staggered so Circles search returns varied availability */
export const PEER_BOOKING_OFFSETS: Record<string, BookingSlot[]> = {
  "Lavington Suite": [[3, 7], [18, 22], [29, 33, true]],
  "Runda Villa": [[8, 14], [25, 31]],
  "Gigiri Annex": [[1, 4], [12, 16], [35, 39]],
  "Diani Palm House": [[5, 12], [20, 27]],
  "Ngong Hills Cabin": [[10, 15], [30, 34, true]],
  "Thika Road Apt": [[2, 5], [14, 17], [24, 28]],
  "Muthaiga Guest Wing": [[6, 10], [19, 24]],
  "Nakuru Lake View": [[4, 8], [16, 21], [32, 36]],
};

export const EXPENSE_PROFILES = [
  { category: "Cleaning", amount: 3500, vendor: "CleanPro Services", dayOffset: -2 },
  { category: "Supplies", amount: 4820, vendor: "Carrefour", dayOffset: -5 },
  { category: "Utilities", amount: 2100, vendor: "Kenya Power", dayOffset: -8 },
  { category: "Maintenance", amount: 6500, vendor: "Nairobi Plumber Co.", dayOffset: -12 },
  { category: "Supplies", amount: 1890, vendor: "Naivas", dayOffset: -15 },
  { category: "Staff", amount: 8000, vendor: "House manager", dayOffset: -18 },
  { category: "Cleaning", amount: 2800, vendor: "CleanPro Services", dayOffset: -22 },
  { category: "Utilities", amount: 1450, vendor: "Nairobi Water", dayOffset: -26 },
] as const;
