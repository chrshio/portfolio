"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IPadMock } from "@/components/pos/ipad-mock";
import { POSScreen } from "@/components/pos/pos-screen";
import { BuyerFacingLiveCart, type CheckInPhase } from "@/components/prototypes/buyer-facing-live-cart";
import { cn } from "@/lib/utils";
import type { CartItem, Customer, MenuItem } from "@/lib/pos-types";

const BUYER_DISPLAY_WIDTH = 714;
const BUYER_DISPLAY_HEIGHT = 489;

/** Intended gap between POS and buyer when there is no overlap (matches prior gap-3). */
const PAIR_GAP_PX = 12;

/**
 * Demo customer attached to the order when the buyer "checks in" on the buyer
 * display. In the real product this would be the customer resolved from the
 * tap-to-pay / NFC check-in; in this prototype we always attach Chris Liu.
 */
const CHECKED_IN_CUSTOMER: Customer = {
  id: "buyer-vision-chris-liu",
  name: "Chris Liu",
  phone: "(415) 555-0123",
  stars: 5,
};

/**
 * Dual-screen prototype: Standard (cafe) POS on iPad plus a blank buyer-facing display.
 * When the track is narrower than POS + gap + buyer, overlap increases by exactly that shortfall
 * (margin-left on the buyer becomes gap − overlap) so the transition is continuous.
 */
export function BuyerVisionPrototype() {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<HTMLDivElement>(null);
  const [overlapPx, setOverlapPx] = useState(0);
  const [buyerOrderItems, setBuyerOrderItems] = useState<CartItem[]>([]);
  const [checkInTapId, setCheckInTapId] = useState(0);
  const [checkInPhase, setCheckInPhase] = useState<CheckInPhase>("idle");
  const [attachedCustomer, setAttachedCustomer] = useState<Customer | null>(null);
  const [buyerBareAddNonce, setBuyerBareAddNonce] = useState(0);
  const [buyerBareAddMenuItem, setBuyerBareAddMenuItem] = useState<MenuItem | null>(null);
  const checkInTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearCheckInTimers() {
    for (const t of checkInTimersRef.current) {
      clearTimeout(t);
    }
    checkInTimersRef.current = [];
  }

  useEffect(() => () => clearCheckInTimers(), []);

  function scheduleCheckInTimer(fn: () => void, ms: number) {
    checkInTimersRef.current.push(setTimeout(fn, ms));
  }

  function handleProfileUpsellAdd(item: MenuItem) {
    setBuyerBareAddMenuItem(item);
    setBuyerBareAddNonce((n) => n + 1);
  }

  function handleAdvanceFromCelebration() {
    if (checkInPhase !== "checked-in") return;
    clearCheckInTimers();
    setCheckInPhase("checked-in-exit");
    scheduleCheckInTimer(() => setCheckInPhase("profile"), 500);
  }

  function handleCheckIn() {
    if (checkInPhase !== "idle") return;
    clearCheckInTimers();
    setCheckInTapId((n) => n + 1);
    setCheckInPhase("phone-animating");
    // Phone animation is 1.1s; start fading out welcome as the phone retreats
    scheduleCheckInTimer(() => setCheckInPhase("transitioning"), 1050);
    // After fade-out (0.4s), switch to checked-in screen and attach the
    // customer profile to the order so the POS side mirrors it.
    scheduleCheckInTimer(() => {
      setCheckInPhase("checked-in");
      setAttachedCustomer(CHECKED_IN_CUSTOMER);
    }, 1450);
    // After the free-drink celebration lingers ~5s, play exit animations on
    // the checked-in screen (center card slides up + sides fade out)...
    scheduleCheckInTimer(() => setCheckInPhase("checked-in-exit"), 1450 + 5000);
    // ...then swap in the profile + order breakdown screen, which animates in
    // its own pieces (sidebar rises from the bottom, right panel fades in).
    scheduleCheckInTimer(() => setCheckInPhase("profile"), 1450 + 5000 + 500);
  }

  useLayoutEffect(() => {
    const track = trackRef.current;
    const pos = posRef.current;
    if (!track) return;

    const update = () => {
      const containerW = track.clientWidth;
      const posW = pos?.getBoundingClientRect().width ?? 0;
      if (!containerW || !posW) {
        setOverlapPx(0);
        return;
      }
      const pairWidth = posW + PAIR_GAP_PX + BUYER_DISPLAY_WIDTH;
      setOverlapPx(Math.max(0, Math.round(pairWidth - containerW)));
    };

    const ro = new ResizeObserver(update);
    ro.observe(track);
    if (pos) ro.observe(pos);
    update();

    return () => ro.disconnect();
  }, []);

  return (
    <main className="relative flex h-full min-h-0 w-full flex-col items-center justify-center overflow-auto bg-[#1a1a1a] px-4 py-6">
      <div ref={trackRef} className="relative w-full shrink-0">
        <div className="flex flex-row flex-nowrap items-end justify-center">
          <div
            ref={posRef}
            className="relative z-0 flex h-[min(920px,calc(100vh-96px))] w-[min(100%,1100px)] min-h-0 shrink-0 items-stretch justify-center"
          >
            <IPadMock fillContainer pinDeviceBottom>
              <POSScreen
                onBuyerOrderDisplayChange={setBuyerOrderItems}
                attachedCustomer={attachedCustomer}
                buyerBareAddNonce={buyerBareAddNonce}
                buyerBareAddMenuItem={buyerBareAddMenuItem}
              />
            </IPadMock>
          </div>

          <div
            className={cn(
              "relative z-20 shrink-0 rounded-[2rem] border-[6px] border-[#545454] bg-[#161616] sm:rounded-[2.5rem] sm:border-[10px]",
              overlapPx > 0 ? "shadow-[0_12px_40px_rgba(0,0,0,0.55)]" : "shadow-2xl"
            )}
            style={{
              width: BUYER_DISPLAY_WIDTH,
              height: BUYER_DISPLAY_HEIGHT,
              marginLeft: PAIR_GAP_PX - overlapPx,
            }}
            aria-label="Buyer-facing Live cart display"
          >
            <div className="size-full overflow-hidden rounded-[calc(2rem-7px)] sm:rounded-[calc(2.5rem-11px)]">
              <BuyerFacingLiveCart
                items={buyerOrderItems}
                onCheckInTap={handleCheckIn}
                onAdvanceCheckInToProfile={handleAdvanceFromCelebration}
                onProfileGoToOrderUpsellAdd={handleProfileUpsellAdd}
                checkInPhase={checkInPhase}
                customer={attachedCustomer}
              />
            </div>
            {checkInTapId > 0 ? (
              <div
                key={checkInTapId}
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-[calc(50%-120px)] z-30 flex w-[260px] -translate-x-1/2 justify-center"
              >
                <div className="animate-buyer-checkin-phone-tap origin-bottom will-change-transform">
                  <Image
                    src="/buyer-checkin-phone.png"
                    alt=""
                    width={478}
                    height={1024}
                    draggable={false}
                    className="h-auto w-full select-none rounded-[40px] drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]"
                    style={{
                      maskImage:
                        "linear-gradient(to bottom, black 26%, rgba(0,0,0,0.35) 48%, transparent 92%)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, black 26%, rgba(0,0,0,0.35) 48%, transparent 92%)",
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
