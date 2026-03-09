import { IPadMock } from "@/components/pos/ipad-mock";
import { POSScreenVoice } from "@/components/pos-voice/pos-screen";

export default function CheckoutPOSVoicePage() {
  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <IPadMock>
        <POSScreenVoice />
      </IPadMock>
    </main>
  );
}
