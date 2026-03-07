"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { projects } from "@/lib/prototypes-config";

const EDGE_THRESHOLD_PX = 24;
const HIDE_DELAY_MS = 300;
const MIN_WIDTH_FOR_ALWAYS_VISIBLE = 1600;

export function PrototypeSelectorMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasSpaceForMenu, setHasSpaceForMenu] = useState(true);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const check = () =>
      setHasSpaceForMenu(typeof window !== "undefined" && window.innerWidth >= MIN_WIDTH_FOR_ALWAYS_VISIBLE);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => setMenuOpen(false), HIDE_DELAY_MS);
  }, [clearHideTimeout]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!hasSpaceForMenu && e.clientX <= EDGE_THRESHOLD_PX) {
        clearHideTimeout();
        setMenuOpen(true);
      } else if (!hasSpaceForMenu && menuOpen) {
        scheduleHide();
      }
    },
    [hasSpaceForMenu, menuOpen, clearHideTimeout, scheduleHide]
  );

  const handleMouseLeave = useCallback(() => {
    if (!hasSpaceForMenu) scheduleHide();
  }, [hasSpaceForMenu, scheduleHide]);

  const handleMenuEnter = useCallback(() => {
    if (!hasSpaceForMenu) {
      clearHideTimeout();
      setMenuOpen(true);
    }
  }, [hasSpaceForMenu, clearHideTimeout]);

  const handleMenuLeave = useCallback(() => {
    if (!hasSpaceForMenu) scheduleHide();
  }, [hasSpaceForMenu, scheduleHide]);

  const showMenu = hasSpaceForMenu || menuOpen;

  // Parse current route: /prototypes/checkout-pos/qsr -> { project: checkout-pos, variant: qsr }
  const pathParts = pathname.replace(/^\/prototypes\/?/, "").split("/").filter(Boolean);
  const currentProjectId = pathParts[0] ?? null;
  const currentVariantId = pathParts[1] ?? pathParts[0] ?? null;

  const currentProject = projects.find((p) => p.id === currentProjectId);

  return (
    <>
      {/* Left-edge trigger zone - invisible strip that activates menu */}
      <div
        className="fixed left-0 top-0 bottom-0 z-40 w-[24px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-hidden
      />

      {/* Menu panel - slides in from left */}
      <div
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 w-[240px] transition-transform duration-200 ease-out",
          "bg-[#0d0d0d] border-r border-white/20",
          showMenu ? "translate-x-0" : "-translate-x-full"
        )}
        onMouseEnter={handleMenuEnter}
        onMouseLeave={handleMenuLeave}
      >
        <div className="relative h-full w-[180px] pt-[280px] pl-[59px] pointer-events-auto">
          {/* PROTOTYPES section */}
          <p className="mb-4 text-[10px] font-normal uppercase tracking-wide text-white/45">
            Prototypes
          </p>
          <div className="space-y-1">
            {projects.map((project) => {
              const isSelected = project.id === currentProjectId;
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    const first = project.prototypes.find((p) => p.ready) ?? project.prototypes[0];
                    if (first) router.push(first.path);
                  }}
                  className={cn(
                    "relative flex items-center gap-3 py-1 pl-0 pr-2 text-left text-[12px] transition-colors",
                    isSelected ? "text-white" : "text-white/48 hover:text-white/70"
                  )}
                >
                  {isSelected && (
                    <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[4px] h-4 rounded-[39px] bg-white" />
                  )}
                  <span className="pl-2">{project.name}</span>
                </button>
              );
            })}
          </div>

          {/* VARIANTS section - only for projects with multiple prototypes */}
          {currentProject && currentProject.prototypes.length > 1 && (
            <>
              <p className="mt-10 mb-4 text-[10px] font-normal uppercase tracking-wide text-white/45">
                Variants
              </p>
              <div className="space-y-1">
                {currentProject.prototypes.map((p) => {
                  const isSelected = p.id === currentVariantId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => p.ready && router.push(p.path)}
                      disabled={!p.ready}
                      className={cn(
                        "relative flex items-center gap-3 py-1 pl-0 pr-2 text-left text-[12px] transition-colors",
                        isSelected ? "text-white" : "text-white/48",
                        p.ready ? "hover:text-white/70 cursor-pointer" : "cursor-not-allowed opacity-60"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[4px] h-4 rounded-[39px] bg-white" />
                      )}
                      <span className="pl-2">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
