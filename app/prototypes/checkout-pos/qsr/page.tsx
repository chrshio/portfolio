import { IPadMock } from "@/components/pos/ipad-mock";
import { POSScreenQSR } from "@/components/pos-qsr/pos-screen";

export default function CheckoutPOSQSRPage() {
  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <IPadMock>
        <POSScreenQSR />
      </IPadMock>
    </main>
  );
}
