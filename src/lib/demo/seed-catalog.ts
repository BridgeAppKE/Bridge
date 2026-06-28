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
] as const;

export const DEMO_INVENTORY_ITEMS = [
  { name: "Toilet paper", quantity: 2, alert_threshold: 4 },
  { name: "Hand soap", quantity: 1, alert_threshold: 2 },
  { name: "Towels", quantity: 6, alert_threshold: 4 },
  { name: "Coffee pods", quantity: 8, alert_threshold: 6 },
  { name: "Trash bags", quantity: 3, alert_threshold: 5 },
] as const;

export const DEMO_TASK_TITLES = [
  "Turnover clean",
  "Laundry run",
  "Replace smoke detector battery",
  "Deep clean kitchen",
  "Restock welcome basket",
] as const;
