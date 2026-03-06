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
    name: "Project 1: Checkout POS",
    prototypes: [
      { id: "qsr", name: "Prototype 1 QSR", path: "/prototypes/checkout-pos/qsr", ready: true },
      { id: "fsr", name: "Prototype 2 FSR", path: "/prototypes/checkout-pos/fsr", ready: false },
      { id: "retail", name: "Prototype 3 Retail", path: "/prototypes/checkout-pos/retail", ready: false },
      { id: "voice", name: "Prototype 4 Voice ordering", path: "/prototypes/checkout-pos/voice", ready: false },
    ],
  },
  {
    id: "printer-routing",
    name: "Project 2: Printer routing",
    prototypes: [
      { id: "main", name: "Printer routing", path: "/prototypes/printer-routing", ready: false },
    ],
  },
];
