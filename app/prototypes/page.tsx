import { redirect } from "next/navigation";
import { projects } from "@/lib/prototypes-config";

export default async function PrototypesIndexPage({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  const defaultProject = projects[0];
  const defaultPrototype = defaultProject?.prototypes.find((p) => p.ready) ?? defaultProject?.prototypes[0];
  const defaultPath = defaultPrototype?.path ?? "/prototypes/checkout-pos/cafe";
  redirect(defaultPath);
}
