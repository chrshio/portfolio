/**
 * Fake customer data for the retail POS "Add customer" prototype.
 */
import type { Customer } from "@/lib/pos-types";

export const prototypeCustomers: Customer[] = [
  {
    id: "cust-aaron",
    name: "Aaron Dias-Melim",
    email: "aarondmelim@gmail.com",
    phone: "(919) 555-0119",
    stars: 12,
  },
  {
    id: "cust-abdul",
    name: "Abdul Karim Kandkher",
    email: "abdul.kandkher@gmail.com",
    phone: "(920) 555-7518",
    stars: 0,
  },
  {
    id: "cust-adam",
    name: "Adam Cortez",
    email: "cortez5926@gmail.com",
    phone: "(314) 555-8079",
    stars: 24,
  },
  {
    id: "cust-alycia",
    name: "Alycia Lin",
    email: "alycia4545@gmail.com",
    phone: "(864) 555-2539",
    stars: 76,
  },
  {
    id: "cust-atsuko",
    name: "Atsuko Ikeda",
    email: "ikeda44atsuko@gmail.com",
    phone: "(917) 555-3747",
    stars: 31,
  },
  {
    id: "cust-brian-1",
    name: "Brian Logan",
    phone: "(408) 867-3039",
    stars: 5,
  },
  {
    id: "cust-brian-2",
    name: "Brian Logan",
    email: "brian.logan@example.com",
    phone: "(408) 867-3039",
    stars: 0,
  },
];

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getCustomerInitials(customer: Customer): string {
  return getInitials(customer.name);
}
