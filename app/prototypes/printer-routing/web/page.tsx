import { PrinterRoutingWebPageClient } from "./printer-routing-web-page-client";

export default async function PrinterRoutingWebPage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  return <PrinterRoutingWebPageClient />;
}
