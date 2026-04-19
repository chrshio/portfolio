import { PrototypesLayoutClient } from "./prototypes-layout-client";

export default async function PrototypesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  return <PrototypesLayoutClient>{children}</PrototypesLayoutClient>;
}
