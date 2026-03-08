import { redirect } from "next/navigation";
import { projects } from "@/lib/prototypes-config";

export default function PrototypesIndexPage() {
  const defaultProject = projects[0];
  const defaultPrototype = defaultProject?.prototypes.find((p) => p.ready) ?? defaultProject?.prototypes[0];
  const defaultPath = defaultPrototype?.path ?? "/prototypes/checkout-pos/cafe";
  redirect(defaultPath);
}
