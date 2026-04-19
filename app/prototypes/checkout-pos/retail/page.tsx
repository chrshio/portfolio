import { RetailPageClient } from "./retail-page-client";

export default async function CheckoutPOSRetailPage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  return <RetailPageClient />;
}
