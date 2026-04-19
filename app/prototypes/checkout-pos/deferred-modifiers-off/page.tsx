import { IPadMock } from "@/components/pos/ipad-mock";
import { POSScreenDeferredModifiersOff } from "@/components/pos-deferred-modifiers-off/pos-screen";

export default async function CheckoutPOSDeferredModifiersOffPage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <IPadMock>
        <POSScreenDeferredModifiersOff />
      </IPadMock>
    </main>
  );
}
