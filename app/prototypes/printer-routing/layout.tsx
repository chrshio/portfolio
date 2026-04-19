import { PrinterRoutingProvider } from "@/components/printer-routing/printer-routing-context";

export default async function PrinterRoutingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  return <PrinterRoutingProvider>{children}</PrinterRoutingProvider>;
}
