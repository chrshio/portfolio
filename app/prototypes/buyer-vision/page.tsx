import { BuyerVisionPrototype } from "@/components/prototypes/buyer-vision-prototype";

export default async function BuyerVisionPage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  return <BuyerVisionPrototype />;
}
