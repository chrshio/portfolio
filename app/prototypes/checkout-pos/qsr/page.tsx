import { IPadMock } from "@/components/pos/ipad-mock";
import { POSScreenQSR } from "@/components/pos-qsr/pos-screen";

export default async function CheckoutPOSQSRPage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <IPadMock>
        <POSScreenQSR />
      </IPadMock>
    </main>
  );
}
