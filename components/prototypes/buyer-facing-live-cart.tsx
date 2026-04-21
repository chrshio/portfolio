"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import type { CartItem, Customer, MenuItem } from "@/lib/pos-types";
import { getModifierDisplay, getModifierPriceDelta } from "@/lib/modifiers";
import { bakeryItems, featuredItems, icedTeaItems, teaItems } from "@/lib/menu-library";

/** Rotating upsell strip on the buyer profile (after each Add, show the next). */
const BUYER_UPSELL_SEQUENCE: MenuItem[] = [
  featuredItems.find((i) => i.id === "matcha") ?? featuredItems[0],
  bakeryItems.find((i) => i.id === "pumpkin-loaf") ?? featuredItems[0],
  featuredItems.find((i) => i.id === "latte") ?? featuredItems[0],
  featuredItems.find((i) => i.id === "iced-coffee") ?? featuredItems[0],
  featuredItems.find((i) => i.id === "cappuccino") ?? featuredItems[0],
];

/** First upsell tile (legacy export for POS wiring defaults). */
export const BUYER_GO_TO_ORDER_ITEM = BUYER_UPSELL_SEQUENCE[0];

/** Menu ids for prepared drinks (excludes beans, bakery, merch). Used for birthday free-drink value. */
const BUYER_DRINK_MENU_IDS = new Set(
  [...featuredItems, ...teaItems, ...icedTeaItems].map((i) => i.id),
);

export type CheckInPhase =
  | "idle"
  | "phone-animating"
  | "transitioning"
  | "checked-in"
  | "checked-in-exit"
  | "profile";

/** Sales tax rate used on the buyer-facing breakdown screen. */
const BUYER_TAX_RATE = 0.0725;

const STARBURST_SPIKES = 44;
const STARBURST_OUTER = 248;
const STARBURST_INNER = 210;
const STARBURST_CENTER = 256;
const STARBURST_POINTS = Array.from(
  { length: STARBURST_SPIKES * 2 },
  (_, i) => {
    const angle = (Math.PI * i) / STARBURST_SPIKES - Math.PI / 2;
    const radius = i % 2 === 0 ? STARBURST_OUTER : STARBURST_INNER;
    const x = STARBURST_CENTER + Math.cos(angle) * radius;
    const y = STARBURST_CENTER + Math.sin(angle) * radius;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  },
).join(" ");

function unitPrice(item: CartItem): number {
  return item.price + getModifierPriceDelta(item, item.modifiers ?? []);
}

function lineTotal(item: CartItem): number {
  return unitPrice(item) * item.quantity;
}

/** POS cart ids from the modifier flow use `${menuItemId}-${Date.now()}`. */
function baseMenuIdFromCartItemId(cartId: string): string {
  const last = cartId.lastIndexOf("-");
  if (last <= 0) return cartId;
  const suffix = cartId.slice(last + 1);
  if (/^\d{10,}$/.test(suffix)) return cartId.slice(0, last);
  return cartId;
}

/** Highest per-unit drink price in the cart (modifiers included). */
function maxPricedDrinkUnitInCart(items: CartItem[]): number {
  let max = 0;
  for (const item of items) {
    const baseId = item.menuItemId ?? baseMenuIdFromCartItemId(item.id);
    if (!BUYER_DRINK_MENU_IDS.has(baseId)) continue;
    max = Math.max(max, unitPrice(item));
  }
  return max;
}

/** Secondary line: same signals as CartItemRow (variants + modifiers + note), not menu description. */
function buyerOrderLineSurfaceDetails(item: CartItem): string | null {
  const parts: string[] = [];
  const mods = item.modifiers ?? [];
  if (mods.length > 0) {
    const { variantName, modifierNames } = getModifierDisplay(
      item,
      mods,
      item.nestedModifierSelections,
    );
    if (variantName) parts.push(variantName);
    parts.push(...modifierNames);
  }
  const note = item.note?.trim();
  if (note) parts.push(note);
  if (parts.length === 0) return null;
  return parts.join(" • ");
}

function CanyonCoffeeLogo() {
  return (
    <div className="relative flex h-[60px] w-[72px] items-center justify-center overflow-hidden rounded-[16px] bg-white shadow-sm">
      <Image
        src="/canyon-coffee-logo.png"
        alt="Canyon Coffee"
        width={72}
        height={60}
        priority
        className="box-content size-full object-contain"
      />
    </div>
  );
}

function BuyerFacingWelcomeEmpty({
  onCheckInTap,
  isTransitioning,
}: {
  onCheckInTap?: () => void;
  isTransitioning?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full flex-col items-center justify-center overflow-hidden bg-[#3a251a] px-6 text-center${isTransitioning ? " animate-buyer-welcome-fade-out" : ""}`}
    >
      <div className="relative z-[1] flex flex-col items-center gap-6">
        <CanyonCoffeeLogo />
        <h1 className="max-w-[760px] text-[72px] font-medium leading-[100%] tracking-[-2px] text-white">
          Welcome to
          <br />
          Canyon Coffee
        </h1>
        <button
          type="button"
          className="rounded-full border border-white/70 px-6 py-2.5 text-[15px] font-medium text-white"
        >
          Sign up
        </button>
      </div>
      <button
        type="button"
        className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 rounded-t-[22px] bg-[#101010] px-10 pb-3.5 pt-4 text-[16px] font-medium leading-snug text-white active:bg-[#181818]"
        onClick={onCheckInTap}
      >
        Check in
      </button>
    </div>
  );
}

function getFirstName(fullName?: string): string {
  if (!fullName) return "Chris";
  const first = fullName.trim().split(/\s+/)[0];
  return first || "Chris";
}

function BuyerFacingCheckedIn({
  isExiting = false,
  customer,
  onContinueToOrder,
}: {
  isExiting?: boolean;
  customer?: Customer | null;
  /** Skip the celebration timer and go to the order (profile) screen. */
  onContinueToOrder?: () => void;
}) {
  const cardAnim = isExiting
    ? "animate-buyer-checkin-card-exit"
    : "animate-buyer-checkin-card-enter";
  const textAnim = isExiting
    ? "animate-buyer-checkin-text-exit"
    : "animate-buyer-checkin-text-enter";

  return (
    <div className="grid h-full min-h-0 w-full grid-cols-[minmax(168px,1fr)_auto_1fr] items-stretch gap-3 overflow-hidden bg-[#101010] px-5">
      <div className="flex items-end justify-end pb-10">
        <div className={`${textAnim} w-[168px] shrink-0 text-left`}>
          <p className="text-[24px] font-normal leading-[1.2] tracking-[-1px] text-white">
            Happy birthday, {getFirstName(customer?.name)}! Your drink is on us today.
          </p>
        </div>
      </div>

      <div className={`${cardAnim} my-8 flex w-[320px] min-h-0 flex-col items-center rounded-[20px] bg-[#3a251a] px-4 py-4 gap-4`}>
        <div className="relative flex flex-1 min-h-0 w-full items-center justify-center overflow-hidden py-1">
          <div className="relative aspect-square w-[min(252px,90%)] shrink-0">
            <svg
              viewBox="0 0 512 512"
              className="animate-buyer-checkin-starburst block size-full"
              aria-hidden="true"
            >
              <polygon points={STARBURST_POINTS} fill="#ede1c5" />
            </svg>
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{ clipPath: "circle(41% at 50% 50%)" }}
            >
              <Image
                src="/buyer-checkin-drink.png"
                alt="Free drink"
                width={512}
                height={512}
                className="size-full origin-center scale-[0.84] object-cover"
                priority
              />
            </div>
          </div>
        </div>
        <div className="w-full shrink-0 rounded-full bg-[#2a1810] py-3.5 text-center text-[17px] font-medium text-white">
          Free drink applied
        </div>
      </div>

      <div className="flex h-full min-h-0 w-full min-w-0 items-center justify-end">
        <div className={`${textAnim} shrink-0`}>
          <button
            type="button"
            className="rounded-full border border-white/25 p-3.5 text-white active:bg-white/10"
            aria-label="Continue to order"
            disabled={isExiting}
            onClick={() => {
              if (isExiting) return;
              onContinueToOrder?.();
            }}
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

/** One face of the flippable card: full gray tile (and optional profile row). */
function BuyerRecommendationFace({
  item,
  addAck,
  noCustomerOnOrder,
  customerName,
  onAdd,
  interactable,
  rotationDeg,
}: {
  item: MenuItem;
  addAck: boolean;
  noCustomerOnOrder: boolean;
  /** When set, profile row appears at the top of this face (same on both faces while flipping). */
  customerName?: string;
  onAdd: () => void;
  /** Only the visible face should take clicks / tab focus. */
  interactable: boolean;
  /** 0 for front, 180 for back — pre-rotates the face so `backface-visibility: hidden` works. */
  rotationDeg: 0 | 180;
}) {
  const isGoTo = BUYER_UPSELL_SEQUENCE.findIndex((i) => i.id === item.id) === 0;
  const label = isGoTo
    ? noCustomerOnOrder
      ? "Pairs well with"
      : "Your go-to order"
    : "You might also like";

  return (
    <div
      className="absolute inset-0 flex min-h-0 flex-col overflow-hidden rounded-[20px] bg-[#1c1c1c] p-4"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: `rotateY(${rotationDeg}deg)`,
      }}
      aria-hidden={!interactable}
    >
      {customerName ? (
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
            <Image
              src="/buyer-profile-photo.jpg"
              alt={`${customerName} profile photo`}
              width={80}
              height={80}
              className="size-full object-cover"
            />
          </div>
          <p className="text-[20px] font-medium tracking-[-0.01em] text-white">
            {customerName}
          </p>
        </div>
      ) : null}

      <p
        className={
          (customerName ? "mt-4 " : "") +
          "text-[11px] font-medium uppercase tracking-[0.06em] text-white/55"
        }
      >
        {label}
      </p>

      <div className="relative mt-3 aspect-square w-full shrink-0 overflow-hidden rounded-[20px] bg-[#2a2a2a]">
        <Image
          src={item.image ?? "/matcha.png"}
          alt={item.name}
          width={400}
          height={400}
          className={
            "size-full object-cover transition-opacity duration-200 " +
            (addAck ? "opacity-50" : "opacity-100")
          }
        />
        {addAck ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-black/40 transition-opacity duration-200"
          />
        ) : null}
      </div>

      <p
        className={
          "mt-3 text-[16px] font-medium transition-colors duration-200 " +
          (addAck ? "text-white/50" : "text-white")
        }
      >
        {item.name}
      </p>

      <div className="flex-1" />

      <button
        type="button"
        aria-busy={addAck}
        disabled={addAck || !interactable}
        tabIndex={interactable ? 0 : -1}
        className={
          "mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#3a3a3a] py-3 text-[15px] font-medium text-white active:bg-[#4a4a4a] " +
          "disabled:pointer-events-none disabled:opacity-100 " +
          (addAck ? "text-white/60" : "")
        }
        onClick={onAdd}
      >
        {addAck ? (
          <>
            <Check className="size-5 shrink-0 stroke-[2.5]" aria-hidden />
            Added
          </>
        ) : (
          <>Add · ${item.price.toFixed(2)}</>
        )}
      </button>
    </div>
  );
}

function BuyerRecommendationsPanel({
  onGoToOrderAdd,
  /** Checked-in profile: both flip faces include avatar + name at the top of the gray card. */
  customerName,
  /** Staff order with no checked-in guest: first tile uses “Pairs well with” (uppercase in UI). */
  noCustomerOnOrder = false,
}: {
  onGoToOrderAdd?: (item: MenuItem) => void;
  customerName?: string;
  noCustomerOnOrder?: boolean;
}) {
  const [upsellIndex, setUpsellIndex] = useState(0);
  const [addAck, setAddAck] = useState(false);
  const addAckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const upsell = BUYER_UPSELL_SEQUENCE[upsellIndex % BUYER_UPSELL_SEQUENCE.length]!;

  // Two faces of the flip card; update the hidden face, then rotate 180°.
  const [frontUpsell, setFrontUpsell] = useState<MenuItem>(BUYER_UPSELL_SEQUENCE[0]!);
  const [backUpsell, setBackUpsell] = useState<MenuItem>(
    BUYER_UPSELL_SEQUENCE[1] ?? BUYER_UPSELL_SEQUENCE[0]!,
  );
  const [flipDeg, setFlipDeg] = useState(0);
  const visibleIsFront = Math.floor((((flipDeg % 360) + 360) % 360) / 180) === 0;
  const visibleUpsell = visibleIsFront ? frontUpsell : backUpsell;

  useEffect(() => {
    if (visibleUpsell.id === upsell.id) return;
    if (visibleIsFront) {
      setBackUpsell(upsell);
    } else {
      setFrontUpsell(upsell);
    }
    // Paint the updated hidden face before starting the rotation so the
    // new item is already baked into the back when it flips into view.
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFlipDeg((d) => d + 180));
    });
    return () => cancelAnimationFrame(raf1);
  }, [upsell.id, visibleIsFront, visibleUpsell.id, upsell]);

  useEffect(() => {
    return () => {
      if (addAckTimerRef.current) clearTimeout(addAckTimerRef.current);
    };
  }, []);

  function handleUpsellAdd() {
    if (addAck) return;
    onGoToOrderAdd?.(visibleUpsell);
    setAddAck(true);
    if (addAckTimerRef.current) clearTimeout(addAckTimerRef.current);
    addAckTimerRef.current = setTimeout(() => {
      addAckTimerRef.current = null;
      setAddAck(false);
      setUpsellIndex((i) => (i + 1) % BUYER_UPSELL_SEQUENCE.length);
    }, 1100);
  }

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      style={{ perspective: "1200px" }}
    >
      <div className="relative min-h-0 flex-1">
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${flipDeg}deg)`,
            transition: "transform 0.7s cubic-bezier(0.4, 0.0, 0.2, 1)",
          }}
        >
          <BuyerRecommendationFace
            item={frontUpsell}
            addAck={addAck}
            noCustomerOnOrder={noCustomerOnOrder}
            customerName={customerName}
            onAdd={handleUpsellAdd}
            interactable={visibleIsFront}
            rotationDeg={0}
          />
          <BuyerRecommendationFace
            item={backUpsell}
            addAck={addAck}
            noCustomerOnOrder={noCustomerOnOrder}
            customerName={customerName}
            onAdd={handleUpsellAdd}
            interactable={!visibleIsFront}
            rotationDeg={180}
          />
        </div>
      </div>
    </div>
  );
}

function BuyerProfileSidebar({
  customerName,
  onGoToOrderAdd,
}: {
  customerName: string;
  /** Adds this upsell line on the POS with no modifiers; sidebar then shows the next suggestion. */
  onGoToOrderAdd?: (item: MenuItem) => void;
}) {
  return (
    <aside className="animate-buyer-profile-sidebar-enter flex w-[227px] shrink-0 min-h-0 self-stretch flex-col">
      <BuyerRecommendationsPanel
        customerName={customerName}
        onGoToOrderAdd={onGoToOrderAdd}
      />
    </aside>
  );
}

/** Modifier / secondary line: cross-dissolve between detail strings. */
function BuyerOrderDetailsCrossfade({ details }: { details: string }) {
  const [rendered, setRendered] = useState(details);
  const [exiting, setExiting] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (details === rendered) return;
    setExiting(rendered);
    setRendered(details);
  }, [details, rendered]);

  useEffect(() => {
    if (exiting === null) return;
    const t = window.setTimeout(() => setExiting(null), 350);
    return () => window.clearTimeout(t);
  }, [exiting]);

  const baseDetailClass =
    "mt-0 text-[14px] font-normal leading-snug text-white/55";

  return (
    <div className="relative mt-0.5">
      <div className="relative">
        {exiting !== null ? (
          <p
            aria-hidden
            className={
              "animate-buyer-order-details-dissolve-out pointer-events-none absolute inset-x-0 top-0 " +
              baseDetailClass
            }
          >
            {exiting}
          </p>
        ) : null}
        <p
          key={rendered}
          className={
            (exiting !== null
              ? "animate-buyer-order-details-dissolve-in "
              : "") + baseDetailClass
          }
        >
          {rendered}
        </p>
      </div>
    </div>
  );
}

function BuyerOrderLineRow({
  item,
  isNew,
  details,
}: {
  item: CartItem;
  isNew: boolean;
  details: string | null;
}) {
  return (
    <li
      data-buyer-cart-item={item.id}
      className={
        "flex items-start justify-between gap-3 text-[20px] text-white" +
        (isNew ? " animate-buyer-order-line-enter" : "")
      }
    >
      <div className="min-w-0 flex-1">
        <div className="truncate pr-2">
          {item.name}
          {item.quantity > 1 ? ` x ${item.quantity}` : ""}
        </div>
        {details ? <BuyerOrderDetailsCrossfade details={details} /> : null}
      </div>
      <span className="shrink-0 tabular-nums">${lineTotal(item).toFixed(2)}</span>
    </li>
  );
}

function BuyerOrderBreakdown({
  items,
  birthdayDiscountActive,
  animateEnter = true,
}: {
  items: CartItem[];
  /** When false (no customer checked in on the order), hide the birthday discount row. */
  birthdayDiscountActive: boolean;
  /** Turn off entrance animation when the panel is already visible and only line items update. */
  animateEnter?: boolean;
}) {
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  /** Flip keys: cart line `id`, or `birthday` / `tax` for rows after the list. */
  const prevFlipTopRef = useRef<Map<string, number>>(new Map());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const prevOrderTailRef = useRef<{ len: number; lastId: string | null }>({
    len: 0,
    lastId: null,
  });
  const [showOrderTopFade, setShowOrderTopFade] = useState(false);

  const newlyAddedIds = new Set<string>();
  for (const item of items) {
    if (!seenIdsRef.current.has(item.id)) newlyAddedIds.add(item.id);
  }

  const itemsLayoutKey =
    items.length === 0
      ? "__empty__"
      : items
          .map(
            (i) =>
              `${i.id}:${i.quantity}:${buyerOrderLineSurfaceDetails(i) ?? ""}:${lineTotal(i)}`,
          )
          .join("|");

  // FLIP: cart lines plus tax / birthday rows (same scroll column) share one
  // motion so nothing “teleports” below the list. Uses viewport Y + reflow
  // so the invert frame paints before the transition.
  useLayoutEffect(() => {
    if (itemsLayoutKey === "__empty__") {
      prevFlipTopRef.current = new Map();
      seenIdsRef.current = new Set();
      prevOrderTailRef.current = { len: 0, lastId: null };
      setShowOrderTopFade(false);
      return;
    }

    const root = scrollBodyRef.current;
    if (!root) return;

    const current = new Map<string, number>();
    for (const el of root.querySelectorAll<HTMLElement>(
      "[data-buyer-cart-item], [data-buyer-flip-row]",
    )) {
      const key =
        el.getAttribute("data-buyer-cart-item") ??
        el.getAttribute("data-buyer-flip-row");
      if (!key) continue;
      current.set(key, el.getBoundingClientRect().top);
    }

    for (const [key, newTop] of current) {
      const oldTop = prevFlipTopRef.current.get(key);
      if (oldTop === undefined) continue;
      const delta = oldTop - newTop;
      if (Math.abs(delta) < 0.5) continue;
      const el =
        key === "birthday" || key === "tax"
          ? root.querySelector<HTMLElement>(`[data-buyer-flip-row="${key}"]`)
          : root.querySelector<HTMLElement>(
              `[data-buyer-cart-item="${CSS.escape(key)}"]`,
            );
      if (!el) continue;
      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px)`;
      void el.offsetHeight;
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.24s cubic-bezier(0.55, 0, 1, 1)";
        el.style.transform = "";
      });
      window.setTimeout(() => {
        el.style.transition = "";
        el.style.transform = "";
      }, 280);
    }

    prevFlipTopRef.current = current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    seenIdsRef.current = new Set(items.map((i) => i.id));

    const len = items.length;
    const lastId = len > 0 ? items[len - 1]!.id : null;
    const tail = prevOrderTailRef.current;
    const appendedNewLastLine =
      tail.len > 0 &&
      len > tail.len &&
      lastId != null &&
      lastId !== tail.lastId;
    prevOrderTailRef.current = { len, lastId };
    if (appendedNewLastLine && scrollBodyRef.current) {
      scrollBodyRef.current.scrollTo({
        top: scrollBodyRef.current.scrollHeight,
        behavior: "auto",
      });
    }
    const scrollEl = scrollBodyRef.current;
    if (scrollEl) {
      setShowOrderTopFade(scrollEl.scrollTop > 4);
    }
  }, [itemsLayoutKey]);

  const subtotal = items.reduce((s, item) => s + lineTotal(item), 0);
  const discount =
    birthdayDiscountActive && items.length > 0
      ? Math.min(subtotal, maxPricedDrinkUnitInCart(items))
      : 0;
  const tax = Math.max(0, subtotal - discount) * BUYER_TAX_RATE;
  const total = Math.max(0, subtotal - discount + tax);

  return (
    <section
      className={
        (animateEnter ? "animate-buyer-profile-main-enter " : "") +
        "flex min-h-0 min-w-0 flex-1 flex-col px-6 py-4 tracking-[-0.02em]"
      }
    >
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollBodyRef}
          className="h-full overflow-y-auto pb-10 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          onScroll={(e) => setShowOrderTopFade(e.currentTarget.scrollTop > 4)}
        >
          {items.length > 0 ? (
            <ul ref={listRef} className="flex flex-col gap-2">
              {items.map((item) => (
                <BuyerOrderLineRow
                  key={item.id}
                  item={item}
                  isNew={newlyAddedIds.has(item.id)}
                  details={buyerOrderLineSurfaceDetails(item)}
                />
              ))}
            </ul>
          ) : null}

          {birthdayDiscountActive ? (
            <div
              data-buyer-flip-row="birthday"
              className={
                (items.length > 0 ? "mt-3 " : "") +
                "flex items-baseline justify-between text-[20px] text-white"
              }
            >
              <span>Free birthday drink</span>
              <span className="tabular-nums">-${discount.toFixed(2)}</span>
            </div>
          ) : null}

          <div
            data-buyer-flip-row="tax"
            className="mt-3 flex items-baseline justify-between text-[20px] text-white"
          >
            <span>
              Tax <span className="text-white/45">(7.25%)</span>
            </span>
            <span className="tabular-nums">${tax.toFixed(2)}</span>
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-12 bg-gradient-to-t from-[#101010] to-transparent"
        />
        {showOrderTopFade ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-12 bg-gradient-to-b from-[#101010] to-transparent"
          />
        ) : null}
      </div>

      <div className="mt-3 flex justify-end">
        <span className="text-[80px] font-medium leading-[0.95] tracking-[-0.035em] tabular-nums text-white">
          ${total.toFixed(2)}
        </span>
      </div>
    </section>
  );
}

function BuyerFacingProfile({
  items,
  customerName,
  birthdayDiscountActive,
  onGoToOrderAdd,
}: {
  items: CartItem[];
  customerName: string;
  birthdayDiscountActive: boolean;
  onGoToOrderAdd?: (item: MenuItem) => void;
}) {
  return (
    <div className="flex h-full min-h-0 w-full gap-4 overflow-hidden bg-[#101010] p-4">
      <BuyerProfileSidebar customerName={customerName} onGoToOrderAdd={onGoToOrderAdd} />
      <BuyerOrderBreakdown items={items} birthdayDiscountActive={birthdayDiscountActive} />
    </div>
  );
}

export function BuyerFacingLiveCart({
  items,
  onCheckInTap,
  onAdvanceCheckInToProfile,
  onProfileGoToOrderUpsellAdd,
  checkInPhase = "idle",
  customer,
}: {
  items: CartItem[];
  onCheckInTap?: () => void;
  /** During the birthday celebration, advances to the profile / order screen (same as the auto timer). */
  onAdvanceCheckInToProfile?: () => void;
  /** Profile sidebar “Add” — adds that menu line on the POS bare for staff to configure. */
  onProfileGoToOrderUpsellAdd?: (item: MenuItem) => void;
  checkInPhase?: CheckInPhase;
  customer?: Customer | null;
}) {
  const customerName = customer?.name ?? "Chris Liu";

  // Once the buyer is fully checked in, stay on the profile + order breakdown
  // screen regardless of whether the cart has items yet.
  if (checkInPhase === "profile") {
    return (
      <BuyerFacingProfile
        items={items}
        customerName={customerName}
        birthdayDiscountActive={Boolean(customer)}
        onGoToOrderAdd={onProfileGoToOrderUpsellAdd}
      />
    );
  }

  if (items.length === 0) {
    if (checkInPhase === "checked-in" || checkInPhase === "checked-in-exit") {
      return (
        <BuyerFacingCheckedIn
          isExiting={checkInPhase === "checked-in-exit"}
          customer={customer}
          onContinueToOrder={onAdvanceCheckInToProfile}
        />
      );
    }
    return (
      <BuyerFacingWelcomeEmpty
        onCheckInTap={onCheckInTap}
        isTransitioning={checkInPhase === "transitioning"}
      />
    );
  }

  // Cart has lines: same dark order-breakdown as the profile screen. When no
  // customer is attached, skip the profile header but still show recommendations
  // in a left column that slides in from the left.
  return (
    <div className="flex h-full min-h-0 w-full gap-4 overflow-hidden bg-[#101010] p-4">
      {customer ? null : (
        <aside className="animate-buyer-recommendations-slide-in-from-left flex w-[227px] shrink-0 min-h-0 self-stretch flex-col">
          <BuyerRecommendationsPanel
            onGoToOrderAdd={onProfileGoToOrderUpsellAdd}
            noCustomerOnOrder
          />
        </aside>
      )}
      <BuyerOrderBreakdown
        items={items}
        birthdayDiscountActive={Boolean(customer)}
      />
    </div>
  );
}
