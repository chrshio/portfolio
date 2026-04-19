import { LandingPage } from "@/components/landing/landing-page";

export default async function Home({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  return <LandingPage />;
}
