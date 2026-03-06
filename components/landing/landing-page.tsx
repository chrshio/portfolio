"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GATE_STORAGE_KEY } from "@/lib/gate";
import { LANDING_TEXT_COLOR } from "@/lib/contrast-from-background";

export function LandingPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const expected =
      process.env.NEXT_PUBLIC_GATE_PASSWORD ?? "pasta";
    if (password === expected) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(GATE_STORAGE_KEY, "true");
      }
      router.push("/prototypes");
      return;
    }
    setError("Incorrect password");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Three ovals: heights as % of viewport; 80% width with side padding */}
      <div className="absolute inset-y-0 left-[10%] right-[10%]">
        {/* First oval: 30vh */}
        <div
          className="absolute left-0 right-0 top-0 z-[3] h-[30vh] w-full"
          style={{
            background:
              "linear-gradient(to bottom, #04DCFF 0%, #475ACB 70%, #475ACB 100%)",
            borderRadius: "50%",
            filter: "blur(40px)",
            transform: "scaleX(1.2)",
          }}
        />
        {/* Second oval: 50vh (starts below first) */}
        <div
          className="absolute left-0 right-0 top-[30vh] z-[2] h-[50vh] w-full"
          style={{
            background: "#FFF991",
            borderRadius: "50%",
            filter: "blur(35px)",
            transform: "scaleX(1.2)",
          }}
        />
        {/* Third oval: 28vh, solid #EADFD9, behind second */}
        <div
          className="absolute left-0 right-0 top-[72vh] z-[1] h-[28vh] w-full"
          style={{
            background: "#EADFD9",
            borderRadius: "50%",
            filter: "blur(45px)",
            transform: "scaleX(1.2)",
          }}
        />
      </div>

      {/* Glass overlay (Figma: backdrop-blur 34.35px, bg white 10%) */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backdropFilter: "blur(34px)",
          backgroundColor: "rgba(255,255,255,0.1)",
        }}
      />

      {/* Form on top so it’s visible and tappable */}
      <div className="absolute inset-0 z-20 flex flex-col items-center px-6 pt-[calc(30vh-8rem)] text-center">
        <div className="w-full max-w-md opacity-60" style={{ color: LANDING_TEXT_COLOR }}>
          <p className="mb-1 text-[12px] font-normal leading-normal">
            Chris Liu
          </p>
          <p className="mb-2 text-[12px] font-normal leading-normal">
            Product Design
          </p>
          <div className="mb-10 max-w-md text-[12px] font-normal leading-normal">
            <p className="mb-0">Square, Senior Product Designer</p>
            <p className="mb-0">2022-2026</p>
            <p className="mb-0">&nbsp;</p>
            <p className="mb-0">Meta, Product Designer</p>
            <p className="mb-0">2018-2022</p>
            <p className="mb-0">&nbsp;</p>
            <Link
              href="https://www.linkedin.com/in/chrisxliu/"
              target="_blank"
              rel="noopener noreferrer"
              className="block underline"
            >
              LinkedIn
            </Link>
            <Link
              href="mailto:chrisxliu@icloud.com"
              className="block underline"
            >
              Email
            </Link>
            <p className="mb-0">&nbsp;</p>
            <p className="mb-0">Please contact for work samples.</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="h-[45px] w-[157px] rounded-[8px] border-0 bg-black/20 px-4 text-center text-[12px] text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              autoComplete="current-password"
            />
            {error && (
              <p className="text-[12px] text-red-600">{error}</p>
            )}
            <button
              type="submit"
              className="mt-1 text-[12px] underline opacity-80"
              style={{ color: LANDING_TEXT_COLOR }}
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
