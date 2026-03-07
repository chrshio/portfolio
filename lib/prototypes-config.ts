export interface PrototypeItem {
  id: string;
  name: string;
  path: string;
  ready: boolean;
}

export interface ProjectItem {
  id: string;
  name: string;
  prototypes: PrototypeItem[];
}

export const projects: ProjectItem[] = [
  {
    id: "checkout-pos",
    name: "POS checkout",
    prototypes: [
      { id: "qsr", name: "QSR mode", path: "/prototypes/checkout-pos/qsr", ready: true },
      { id: "fsr", name: "FSR mode", path: "/prototypes/checkout-pos/fsr", ready: false },
      { id: "retail", name: "Retail mode", path: "/prototypes/checkout-pos/retail", ready: false },
      { id: "voice", name: "POS vision", path: "/prototypes/checkout-pos/voice", ready: false },
    ],
  },
  {
    id: "printer-routing",
    name: "Printer routing",
    prototypes: [
      { id: "main", name: "Printer routing", path: "/prototypes/printer-routing", ready: false },
    ],
  },
];
