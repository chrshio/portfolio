import { IPadMock } from "@/components/pos/ipad-mock";
import { POSScreenVariantA } from "@/components/pos/pos-screen-variant-a";

/**
 * Variant A prototype — item add/edit in a modal overlay on top of menu + cart;
 * cart does not highlight the item in edit.
 */
export default async function CheckoutPOSVariantAPage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <IPadMock>
        <POSScreenVariantA />
      </IPadMock>
    </main>
  );
}
