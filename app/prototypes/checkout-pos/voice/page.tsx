import { IPadMock } from "@/components/pos/ipad-mock";
import { POSScreenVoice } from "@/components/pos-voice/pos-screen";

export default async function CheckoutPOSVoicePage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <IPadMock>
        <POSScreenVoice />
      </IPadMock>
    </main>
  );
}
