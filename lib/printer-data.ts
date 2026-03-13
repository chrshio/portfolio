export type DeviceType = "Square Terminal" | "Square Stand" | "Square Handheld";

export interface SourceDevice {
  id: string;
  name: string;
  deviceType: DeviceType;
  codeName: string;
  isOnline: boolean;
  isCurrentDevice: boolean;
}

export type PrinterStatus = "connected" | "ready" | "critical" | "not-configured";

export interface TicketAppearance {
  compactTicket: boolean;
  singleItemPerTicket: boolean;
  combineIdenticalItems: boolean;
  includeTopPadding: boolean;
  printKitchenNames: boolean;
}

export const defaultTicketAppearance: TicketAppearance = {
  compactTicket: false,
  singleItemPerTicket: false,
  combineIdenticalItems: false,
  includeTopPadding: false,
  printKitchenNames: false,
};

export interface PrinterData {
  id: string;
  name: string;
  model: string;
  connection: string;
  ipAddress: string;
  serialNumber: string;
  paperSize: string;
  paperType: string;
  sources: SourceDevice[];
  receiptsEnabled: boolean;
  autoPrintReceipts: boolean;
  receiptCopies: number;
  inPersonEnabled: boolean;
  inPersonCategories: string;
  onlineEnabled: boolean;
  sameAsInPerson: boolean;
  ticketAppearance: TicketAppearance;
}

/** All POS devices registered at this business location. */
export const locationDevices: SourceDevice[] = [
  {
    id: "src-counter",
    name: "Counter",
    deviceType: "Square Stand",
    codeName: "Counter iPad",
    isOnline: true,
    isCurrentDevice: true,
  },
  {
    id: "src-cafe-bar",
    name: "Cafe bar",
    deviceType: "Square Terminal",
    codeName: "Cafe bar Terminal",
    isOnline: true,
    isCurrentDevice: false,
  },
  {
    id: "src-kitchen",
    name: "Kitchen",
    deviceType: "Square Terminal",
    codeName: "Kitchen Terminal",
    isOnline: true,
    isCurrentDevice: false,
  },
  {
    id: "src-foh-handheld",
    name: "Host stand",
    deviceType: "Square Handheld",
    codeName: "Host Handheld",
    isOnline: false,
    isCurrentDevice: false,
  },
];

export function computePrinterStatus(printer: PrinterData): PrinterStatus {
  if (printer.sources.length === 0) return "not-configured";
  const hasOnlineSource = printer.sources.some((s) => s.isOnline);
  if (!hasOnlineSource) return "critical";
  const hasCurrentDevice = printer.sources.some((s) => s.isOnline && s.isCurrentDevice);
  if (hasCurrentDevice) return "connected";
  return "ready";
}

export function getPrintsSummary(printer: PrinterData): string {
  const parts: string[] = [];
  if (printer.receiptsEnabled) parts.push("Receipts");
  if (printer.inPersonEnabled) parts.push("In-person orders");
  if (printer.onlineEnabled) parts.push("Online & Kiosk orders");
  return parts.length > 0 ? parts.join(", ") : "—";
}

export const statusConfig: Record<PrinterStatus, { label: string; bg: string; text: string }> = {
  connected: { label: "Connected", bg: "bg-[#e0ffe3]", text: "text-[#008507]" },
  ready: { label: "Ready", bg: "bg-[#e0ffe3]", text: "text-[#008507]" },
  critical: { label: "Critical issue", bg: "bg-[#ffe5ea]", text: "text-[#bf0020]" },
  "not-configured": { label: "Not configured", bg: "bg-[#fff3e0]", text: "text-[#c25400]" },
};

export const initialPrinters: PrinterData[] = [
  {
    id: "cold-oak",
    name: "Cold Printer - OAK",
    model: "Star Micronics SP742ML",
    connection: "Ethernet",
    ipAddress: "192.168.1.40",
    serialNumber: "343667732434502",
    paperSize: "80mm wide",
    paperType: "Thermal",
    sources: [
      {
        id: "src-counter",
        name: "Counter",
        deviceType: "Square Stand",
        codeName: "Counter iPad",
        isOnline: true,
        isCurrentDevice: true,
      },
      {
        id: "src-cafe-bar",
        name: "Cafe bar",
        deviceType: "Square Terminal",
        codeName: "Cafe bar Terminal",
        isOnline: true,
        isCurrentDevice: false,
      },
    ],
    receiptsEnabled: false,
    autoPrintReceipts: false,
    receiptCopies: 1,
    inPersonEnabled: true,
    inPersonCategories: "Appetizers (4)",
    onlineEnabled: true,
    sameAsInPerson: true,
    ticketAppearance: {
      compactTicket: true,
      singleItemPerTicket: false,
      combineIdenticalItems: true,
      includeTopPadding: true,
      printKitchenNames: false,
    },
  },
  {
    id: "hot-oak",
    name: "Hot Printer - OAK",
    model: "Star Micronics SP742ML",
    connection: "Ethernet",
    ipAddress: "192.168.1.41",
    serialNumber: "343667732434518",
    paperSize: "80mm wide",
    paperType: "Thermal",
    sources: [
      {
        id: "src-kitchen",
        name: "Kitchen",
        deviceType: "Square Terminal",
        codeName: "Kitchen Terminal",
        isOnline: true,
        isCurrentDevice: false,
      },
    ],
    receiptsEnabled: false,
    autoPrintReceipts: false,
    receiptCopies: 1,
    inPersonEnabled: true,
    inPersonCategories: "Mains (6), Appetizers (2)",
    onlineEnabled: true,
    sameAsInPerson: true,
    ticketAppearance: {
      compactTicket: false,
      singleItemPerTicket: true,
      combineIdenticalItems: false,
      includeTopPadding: true,
      printKitchenNames: true,
    },
  },
  {
    id: "foh",
    name: "Front of house printer",
    model: "Epson TM-T88VII",
    connection: "USB",
    ipAddress: "—",
    serialNumber: "Y4J0200541",
    paperSize: "80mm wide",
    paperType: "Thermal",
    sources: [
      {
        id: "src-foh-handheld",
        name: "Host stand",
        deviceType: "Square Handheld",
        codeName: "Host Handheld",
        isOnline: false,
        isCurrentDevice: false,
      },
    ],
    receiptsEnabled: true,
    autoPrintReceipts: true,
    receiptCopies: 2,
    inPersonEnabled: true,
    inPersonCategories: "Drinks (6)",
    onlineEnabled: false,
    sameAsInPerson: false,
    ticketAppearance: { ...defaultTicketAppearance },
  },
  {
    id: "bar",
    name: "Bar printer",
    model: "Star Micronics TSP143IIIU",
    connection: "Bluetooth",
    ipAddress: "—",
    serialNumber: "483920174625301",
    paperSize: "80mm wide",
    paperType: "Thermal",
    sources: [],
    receiptsEnabled: false,
    autoPrintReceipts: false,
    receiptCopies: 1,
    inPersonEnabled: false,
    inPersonCategories: "",
    onlineEnabled: false,
    sameAsInPerson: false,
    ticketAppearance: { ...defaultTicketAppearance },
  },
  {
    id: "label-counter",
    name: "Label printer",
    model: "Star Micronics mC-Label3",
    connection: "Ethernet",
    ipAddress: "192.168.1.55",
    serialNumber: "LBL902837465120",
    paperSize: "58mm wide",
    paperType: "Thermal",
    sources: [
      {
        id: "src-counter",
        name: "Counter",
        deviceType: "Square Stand",
        codeName: "Counter iPad",
        isOnline: true,
        isCurrentDevice: true,
      },
    ],
    receiptsEnabled: true,
    autoPrintReceipts: false,
    receiptCopies: 1,
    inPersonEnabled: false,
    inPersonCategories: "",
    onlineEnabled: false,
    sameAsInPerson: false,
    ticketAppearance: { ...defaultTicketAppearance },
  },
];
