"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isGatePassed } from "@/lib/gate";

export default function PrototypesLayout({
  children,
}: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    setAllowed(isGatePassed());
  }, [pathname]);

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

  return <>{children}</>;
}
