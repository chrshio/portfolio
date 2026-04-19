import { IPadMock } from "@/components/pos/ipad-mock";
import { POSScreen } from "@/components/pos/pos-screen";

export default async function CheckoutPOSCafePage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <IPadMock>
        <POSScreen />
      </IPadMock>
    </main>
  );
}
