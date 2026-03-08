import { IPadMock } from "@/components/pos/ipad-mock";
import { POSScreenFSR } from "@/components/pos-fsr/pos-screen";

export default function CheckoutPOSFSRPage() {
  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <IPadMock>
        <POSScreenFSR />
      </IPadMock>
    </main>
  );
}
