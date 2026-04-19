import { IPadMock } from "@/components/pos/ipad-mock";
import { POSScreenFSR } from "@/components/pos-fsr/pos-screen";

export default async function CheckoutPOSFSRPage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <IPadMock>
        <POSScreenFSR />
      </IPadMock>
    </main>
  );
}
