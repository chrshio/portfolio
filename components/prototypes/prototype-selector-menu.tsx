"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { projects, type PrototypeItem } from "@/lib/prototypes-config";

function variantShortLabel(item: PrototypeItem): string {
  const map: Record<string, string> = {
    cafe: "Cafe",
    qsr: "QSR",
    fsr: "FSR",
    retail: "Retail",
    voice: "Voice",
    main: "Main",
  };
  return map[item.id] ?? item.name;
}

export function PrototypeSelectorMenu({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const pathParts = pathname.replace(/^\/prototypes\/?/, "").split("/").filter(Boolean);
  const currentProjectId = pathParts[0] ?? null;
  const currentVariantId = pathParts[1] ?? pathParts[0] ?? null;
  const currentProject = projects.find((p) => p.id === currentProjectId);

  return (
    <div className="h-screen overflow-hidden relative flex flex-col bg-[#1a1a1a]">
      {/* Top: Variant segmented control – sits above the iPad */}
      {currentProject && currentProject.prototypes.length > 1 && (
        <div className="flex-shrink-0 flex justify-center pt-6 pb-1 -mb-24 z-10 relative">
          <div className="flex h-10 items-center gap-1 rounded-full border-[1.4px] border-white/20 overflow-hidden p-1 min-w-[280px] max-w-[372px] w-max relative">
            {/* Same frosted glass as left toggles */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(50px)",
                WebkitBackdropFilter: "blur(50px)",
              }}
            />
            {currentProject.prototypes.map((p) => {
              const isSelected = p.id === currentVariantId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => p.ready && router.push(p.path)}
                  disabled={!p.ready}
                  className={cn(
                    "relative flex flex-1 cursor-pointer items-center justify-center h-8 min-w-[52px] px-3 rounded-full text-[13px] leading-4 overflow-hidden transition-colors",
                    isSelected ? "text-white" : "text-white/60",
                    !p.ready && "cursor-not-allowed opacity-60"
                  )}
                >
                  {isSelected && (
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ background: "rgba(255, 255, 255, 0.08)" }}
                    />
                  )}
                  <span className="relative">{variantShortLabel(p)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* iPad area */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {children}
      </div>

      {/* Left: Prototype switcher – hidden below 1400px; pops up when cursor at left edge */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 z-40 w-[220px] overflow-visible",
          "group"
        )}
      >
        {/* Trigger zone at left edge – hover to reveal panel on narrow screens */}
        <div
          className="absolute left-0 top-0 bottom-0 w-5 min-[1400px]:hidden"
          aria-hidden
        />
        <div
          className={cn(
            "absolute left-6 top-1/2 -translate-y-1/2 z-50 w-[180px] rounded-[24px] border-[1.4px] border-white/20 overflow-hidden p-2 flex flex-col gap-2",
            "min-[1400px]:opacity-100",
            "max-[1399px]:opacity-0 max-[1399px]:pointer-events-none max-[1399px]:transition-opacity max-[1399px]:duration-200",
            "max-[1399px]:group-hover:opacity-100 max-[1399px]:group-hover:pointer-events-auto"
          )}
        >
          <div
            className="absolute inset-0 rounded-[16px] pointer-events-none"
            style={{
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(50px)",
              WebkitBackdropFilter: "blur(50px)",
            }}
          />
          {projects.map((project) => {
            const isSelected = project.id === currentProjectId;
            const first = project.prototypes.find((p) => p.ready) ?? project.prototypes[0];
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => first && router.push(first.path)}
                className="relative flex w-full cursor-pointer items-center rounded-2xl px-5 py-2.5 text-left text-[13px] leading-5 text-white overflow-hidden"
              >
                {isSelected && (
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ background: "rgba(255, 255, 255, 0.08)" }}
                  />
                )}
                <span className="relative font-medium text-[14px]">{project.name}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
