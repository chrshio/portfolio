"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isGatePassed } from "@/lib/gate";
import { PrototypeSelectorMenu } from "@/components/prototypes/prototype-selector-menu";

export function PrototypesLayoutClient({
  children,
}: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    setAllowed(isGatePassed());
  }, []);

  useEffect(() => {
    if (allowed === false) router.replace("/");
  }, [allowed, router]);

  if (allowed === null || allowed === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-black/50">Loading…</p>
      </div>
    );
  }

  return (
    <PrototypeSelectorMenu>
      {children}
    </PrototypeSelectorMenu>
  );
}
