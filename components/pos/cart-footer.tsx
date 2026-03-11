"use client";

import { Mic, MicOff } from "lucide-react";

interface CartFooterProps {
  onSave: () => void;
  onPay: () => void;
  disabled?: boolean;
  isEditMode?: boolean;
  onCancel?: () => void;
  onDone?: () => void;
  isAddMode?: boolean;
  onAddCancel?: () => void;
  onAdd?: () => void;
  addDisabled?: boolean;
  isAddSlotDetailMode?: boolean;
  onAddSlotCancel?: () => void;
  onAddSlotDone?: () => void;
  voiceMode?: boolean;
  onVoiceToggle?: () => void;
  /** When true and onVoiceToggle is set, show only the Enable voice button (no Pay). */
  cartEmpty?: boolean;
}

export function CartFooter({
  onSave,
  onPay,
  disabled,
  isEditMode,
  onCancel,
  onDone,
  isAddMode,
  onAddCancel,
  onAdd,
  addDisabled,
  isAddSlotDetailMode,
  onAddSlotCancel,
  onAddSlotDone,
  voiceMode,
  onVoiceToggle,
  cartEmpty,
}: CartFooterProps) {
  if (isAddSlotDetailMode) {
    return (
      <div className="flex items-center gap-3 px-0 py-4">
        <button
          onClick={onAddSlotCancel}
          className="flex-1 py-4 rounded-full bg-[#f0f0f0] text-[#101010] font-medium text-base transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onAddSlotDone}
          className="flex-1 py-4 rounded-full bg-[#101010] text-[#ffffff] font-medium text-base transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  if (isAddMode) {
    return (
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
    );
  }

  if (isEditMode) {
    return (
      <div className="flex items-center gap-3 px-0 py-4">
        <button
          onClick={onCancel}
          className="flex-1 py-4 rounded-full bg-[#f0f0f0] text-[#101010] font-medium text-base transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onDone}
          className="flex-1 py-4 rounded-full bg-[#101010] text-[#ffffff] font-medium text-base transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  if (voiceMode && onVoiceToggle) {
    return (
      <div className="flex items-center gap-3 px-0 py-4">
        <button
          onClick={onVoiceToggle}
          className="flex-1 py-4 rounded-full bg-[#f0f0f0] text-[#101010] font-medium text-base transition-colors flex items-center justify-center"
        >
          <MicOff className="w-5 h-5" />
        </button>
        {!cartEmpty && (
          <button
            onClick={onPay}
            className="flex-1 py-4 rounded-full bg-[#101010] text-[#ffffff] font-medium text-base transition-colors"
          >
            Pay
          </button>
        )}
      </div>
    );
  }

  if (onVoiceToggle && cartEmpty) {
    return (
      <div className="flex items-center gap-3 px-0 py-4">
        <button
          onClick={onVoiceToggle}
          className="flex-1 py-4 rounded-full bg-[#101010] text-[#ffffff] font-medium text-base transition-colors flex items-center justify-center"
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-0 py-4">
      {onVoiceToggle && (
        <button
          onClick={onVoiceToggle}
          className="w-[52px] h-[52px] shrink-0 rounded-full bg-[#101010] text-[#ffffff] font-medium text-base transition-colors flex items-center justify-center"
        >
          <Mic className="w-5 h-5" />
        </button>
      )}
      <button
        onClick={onPay}
        disabled={disabled}
        className="flex-1 py-4 rounded-full bg-[#101010] text-[#ffffff] font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Pay
      </button>
    </div>
  );
}
