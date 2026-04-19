import { redirect } from "next/navigation";

export default async function PrinterRoutingPage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  redirect("/prototypes/printer-routing/main");
}
