"use client";

import { useState } from "react";
import Image from "next/image";
import { CartHeader } from "@/components/pos/cart-header";
import { CartItems } from "@/components/pos/cart-items";
import { CartActionsModal } from "@/components/pos/cart-actions-modal";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CartItem, MenuItem, CourseDefinition, SentBatch } from "@/lib/pos-types";
import { FSR_COURSES } from "@/lib/pos-types";
import { getModifierDisplay } from "@/lib/modifiers";

interface CourseCartSectionProps {
  items: CartItem[];
  activeCourseId: string;
  onActiveCourseChange: (courseId: string) => void;
  courseHolds: Record<string, boolean>;
  onCourseHoldToggle: (courseId: string) => void;
  editingItemId?: string | null;
  onItemClick?: (id: string) => void;
  onRequirementClick?: (itemId: string, groupId: string) => void;
  onEditCancel?: () => void;
  onEditDone?: () => void;
  isAddMode?: boolean;
  addingItemId?: string | null;
  onAddCancel?: () => void;
  onAdd?: () => void;
  onRemoveItem?: (id: string) => void;
  onClearCart?: () => void;
  onSend?: () => void;
  onPrint?: () => void;
  onPay?: () => void;
  getMenuItemById?: (id: string) => MenuItem | undefined;
  /** Number of covers for the table (shown in header subtitle). */
  coverCount?: number;
  /** Whether seating is enabled — shows "Select Seat" requirement in cart items. */
  seatingEnabled?: boolean;
  /** Previously sent items, grouped by send batch. */
  sentBatches?: SentBatch[];
}

function CourseHeader({
  course,
  itemCount,
  isHeld,
  onToggleHold,
  isActive,
  onActivate,
}: {
  course: CourseDefinition;
  itemCount: number;
  isHeld: boolean;
  onToggleHold: () => void;
  isActive: boolean;
  onActivate: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      className="flex w-full cursor-pointer items-center justify-between pl-[18px] pr-4 py-2"
    >
      <span className="text-[14px] font-medium text-[#666666]">
        {course.label}
        {itemCount > 0 && (
          <span className="text-[#666666] font-medium"> ({itemCount})</span>
        )}
      </span>
      {course.holdable ? (
        <span
          className="flex h-10 w-20 shrink-0 rounded-[6px] bg-[rgba(0,0,0,0.05)] p-1"
          onClick={(e) => e.stopPropagation()}
          role="group"
          aria-label="Fire or hold course"
        >
          <button
            type="button"
            onClick={() => isHeld && onToggleHold()}
            className={cn(
              "flex flex-1 items-center justify-center rounded-[4px] h-8 transition-colors",
              !isHeld
                ? "bg-white text-[#cc0023] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.2),0px_0px_4px_0px_rgba(0,0,0,0.1)]"
                : "bg-transparent text-[#666666]"
            )}
            aria-label="Fire"
            aria-pressed={!isHeld}
          >
            <Image
              src={!isHeld ? "/fire-filled.svg" : "/fire.svg"}
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 object-contain"
            />
          </button>
          <button
            type="button"
            onClick={() => !isHeld && onToggleHold()}
            className={cn(
              "flex flex-1 items-center justify-center rounded-[4px] h-8 transition-colors",
              isHeld
                ? "bg-white text-[#101010] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.2),0px_0px_4px_0px_rgba(0,0,0,0.1)]"
                : "bg-transparent text-[#666666]"
            )}
            aria-label="Hold"
            aria-pressed={isHeld}
          >
            <Image
              src={isHeld ? "/hold-filled.svg" : "/hold.svg"}
              alt=""
              width={isHeld ? 16 : 20}
              height={isHeld ? 16 : 20}
              className={cn("object-contain", isHeld ? "h-4 w-4" : "h-5 w-5")}
            />
          </button>
        </span>
      ) : (
        <span className="h-10 w-20 shrink-0" aria-hidden="true" />
      )}
    </div>
  );
}

function SentItemsSection({ batches }: { batches: SentBatch[] }) {
  const [expanded, setExpanded] = useState(false);
  const totalItems = batches.reduce(
    (sum, b) => sum + b.groups.reduce((s, g) => s + g.items.reduce((n, i) => n + i.quantity, 0), 0),
    0
  );
  if (totalItems === 0) return null;

  return (
    <div className="rounded-[12px] bg-[#f0f0f0] px-4 py-2 mb-3">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between min-h-[40px] py-2"
      >
        <span className="text-[16px] font-medium text-[#101010]">
          {totalItems} sent {totalItems === 1 ? "item" : "items"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#666] transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="flex flex-col">
          {batches.flatMap((batch) =>
            batch.groups.map((group, gi) => (
              <div key={`${batch.id}-${group.courseId}`}>
                {gi > 0 && <div className="h-px bg-[#dadada] rounded-[2px] my-0" />}
                <div className="py-2">
                  <p className="text-[14px] font-semibold text-[#666] leading-[22px]">
                    {group.courseLabel}
                  </p>
                  <p className="text-[14px] text-[#666] leading-[22px]">
                    Fired at {group.firedAt} by {group.firedBy}
                  </p>
                </div>
                {group.items.map((item) => {
                  const { variantName, modifierNames } = getModifierDisplay(item, item.modifiers ?? []);
                  const secondary = [
                    ...(item.seatId ? [item.seatId === "table" ? "Table" : item.seatId.replace("seat-", "Seat ")] : []),
                    ...(variantName ? [variantName] : []),
                    ...modifierNames,
                  ].join(", ");
                  return (
                    <div key={item.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] font-medium text-[#101010]">
                          {item.name}
                          {item.quantity > 1 && (
                            <span className="text-[#666] font-normal"> × {item.quantity}</span>
                          )}
                        </span>
                        <span className="text-[16px] text-[#101010]">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      {secondary && (
                        <p className="text-[14px] text-[#666] leading-6">{secondary}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function CourseCartSection({
  items,
  activeCourseId,
  onActiveCourseChange,
  courseHolds,
  onCourseHoldToggle,
  editingItemId,
  onItemClick,
  onRequirementClick,
  onEditCancel,
  onEditDone,
  isAddMode,
  addingItemId,
  onAddCancel,
  onAdd,
  onRemoveItem,
  onClearCart,
  onSend,
  onPrint,
  onPay,
  getMenuItemById,
  coverCount,
  seatingEnabled,
  sentBatches,
}: CourseCartSectionProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isEditMode = editingItemId != null;
  const moreDisabled = isEditMode || !!isAddMode;

  return (
    <div className="flex flex-col h-full bg-white pr-6">
      <CartHeader
        itemCount={itemCount}
        orderLabel="Table 1"
        subtitle={coverCount ? `${coverCount} covers` : undefined}
        disabled={moreDisabled}
        onMoreClick={moreDisabled ? undefined : () => setActionsOpen(true)}
      />

      <div className="flex-1 overflow-y-auto">
        {sentBatches && sentBatches.length > 0 && (
          <SentItemsSection batches={sentBatches} />
        )}
        <div className="flex flex-col gap-3">
          {FSR_COURSES.map((course) => {
            const courseItems = items.filter((item) => item.courseId === course.id);
            const isActive = activeCourseId === course.id;
            const isHeld = courseHolds[course.id] ?? false;
            const hasItems = courseItems.length > 0;
            const showActiveStyle = isActive && !isEditMode && !isAddMode;

            return (
              <div
                key={course.id}
                className={cn(
                  "rounded-2xl overflow-hidden",
                  showActiveStyle ? "border-[3px] border-[#101010]" : "border border-[#e5e5e5]"
                )}
              >
                <CourseHeader
                  course={course}
                  itemCount={courseItems.reduce((s, i) => s + i.quantity, 0)}
                  isHeld={isHeld}
                  onToggleHold={() => onCourseHoldToggle(course.id)}
                  isActive={showActiveStyle}
                  onActivate={() => onActiveCourseChange(course.id)}
                />
                {hasItems && (
                  <CartItems
                    items={courseItems}
                    editingItemId={editingItemId}
                    addingItemId={addingItemId}
                    onItemClick={onItemClick}
                    onRequirementClick={onRequirementClick}
                    onRemoveItem={onRemoveItem}
                    getMenuItemById={getMenuItemById}
                    seatingEnabled={seatingEnabled}
                    bare
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto">
        {isEditMode ? (
          <div className="flex items-center gap-3 px-0 py-4">
            <button
              onClick={onEditCancel}
              className="flex-1 py-4 rounded-full bg-[#f0f0f0] text-[#101010] font-medium text-base transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onEditDone}
              className="flex-1 py-4 rounded-full bg-[#101010] text-[#ffffff] font-medium text-base transition-colors"
            >
              Done
            </button>
          </div>
        ) : isAddMode ? (
          <div className="flex items-center gap-3 px-0 py-4">
            <button
              onClick={onAddCancel}
              className="flex-1 py-4 rounded-full bg-[#f0f0f0] text-[#101010] font-medium text-base transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onAdd}
              className="flex-1 py-4 rounded-full bg-[#101010] text-[#ffffff] font-medium text-base transition-colors"
            >
              Add
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onPrint}
                className="flex-1 py-4 rounded-full bg-[#f0f0f0] text-[#101010] font-medium text-base transition-colors"
              >
                Print
              </button>
              <button
                onClick={onPay}
                className="flex-1 py-4 rounded-full bg-[#f0f0f0] text-[#101010] font-medium text-base transition-colors"
              >
                Pay
              </button>
            </div>
            <button
              onClick={onSend}
              className="w-full py-4 rounded-full bg-[#101010] text-[#ffffff] font-medium text-base transition-colors"
            >
              Send
            </button>
          </div>
        )}
      </div>

      <CartActionsModal
        open={actionsOpen}
        onOpenChange={setActionsOpen}
        onClearCart={onClearCart}
      />
    </div>
  );
}
