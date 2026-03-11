"use client";

import { useRef, useEffect, Fragment } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceWaveform } from "./voice-waveform";

// ---- Voice message types ----

export interface VoiceEntity {
  text: string;
  type: "item" | "modifier";
}

export interface VoiceSuggestionOption {
  label: string;
  selected?: boolean;
}

export interface VoiceSuggestion {
  options: VoiceSuggestionOption[];
}

export interface VoiceMessage {
  id: string;
  role: "customer" | "assistant";
  text: string;
  entities?: VoiceEntity[];
  suggestion?: VoiceSuggestion;
  isInterim?: boolean;
}

// ---- Entity-highlighted text renderer ----

function renderTextWithEntities(
  text: string,
  entities?: VoiceEntity[]
): React.ReactNode {
  if (!entities?.length) return text;

  const parts: React.ReactNode[] = [];
  let lastIdx = 0;

  const sorted = [...entities].sort((a, b) => {
    const ai = text.toLowerCase().indexOf(a.text.toLowerCase());
    const bi = text.toLowerCase().indexOf(b.text.toLowerCase());
    return ai - bi;
  });

  for (const entity of sorted) {
    const idx = text.toLowerCase().indexOf(entity.text.toLowerCase(), lastIdx);
    if (idx === -1) continue;

    if (idx > lastIdx) {
      parts.push(
        <Fragment key={`t-${lastIdx}`}>{text.slice(lastIdx, idx)}</Fragment>
      );
    }
    parts.push(
      <span
        key={`e-${idx}`}
        className="underline decoration-2 underline-offset-[3px] font-semibold"
      >
        {text.slice(idx, idx + entity.text.length)}
      </span>
    );
    lastIdx = idx + entity.text.length;
  }

  if (lastIdx < text.length) {
    parts.push(
      <Fragment key={`t-${lastIdx}`}>{text.slice(lastIdx)}</Fragment>
    );
  }

  return parts;
}

// ---- Overlay component ----

interface VoiceOverlayProps {
  messages?: VoiceMessage[];
  isListening?: boolean;
  isProcessing?: boolean;
  error?: string | null;
  onClose: () => void;
  onSuggestionSelect?: (messageId: string, optionLabel: string) => void;
  analyserNode?: AnalyserNode | null;
}

export function VoiceOverlay({
  messages,
  isListening = true,
  isProcessing = false,
  error,
  onClose,
  onSuggestionSelect,
  analyserNode,
}: VoiceOverlayProps) {
  const displayMessages = messages ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages.length]);

  return (
    <div className="absolute inset-0 right-6 z-20 flex flex-col">
      {/* Frosted-glass backdrop — 24px gap from right edge */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "rgba(210, 210, 210, 0.4)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
        }}
      />

      {/* Close button — matches cart header more button (56×56) */}
      <div className="relative z-10 flex justify-end p-4">
        <button
          type="button"
          onClick={onClose}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-[#f0f0f0] text-[#101010] active:bg-[#e5e5e5] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 min-h-0 overflow-y-auto px-8 pb-4 flex flex-col justify-end gap-4"
      >
        {displayMessages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-3">
            {/* Chat bubble */}
            <div
              className={cn(
                "flex",
                msg.role === "customer" ? "justify-start" : "justify-end"
              )}
            >
              <div
                className={cn(
                  "bg-white rounded-[20px] px-6 py-4 max-w-[85%] shadow-sm",
                  msg.isInterim && "opacity-50"
                )}
              >
                <p className="text-[18px] leading-[26px] text-[#1a1a1a]">
                  {renderTextWithEntities(msg.text, msg.entities)}
                </p>
              </div>
            </div>

            {/* Suggestion pills — horizontally below the question */}
            {msg.suggestion && (
              <div className="flex justify-end">
                <div className="flex flex-wrap gap-2">
                  {msg.suggestion.options.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => onSuggestionSelect?.(msg.id, opt.label)}
                      className={cn(
                        "rounded-full px-4 py-2.5 text-[15px] font-medium transition-colors",
                        "bg-[#101010] text-white",
                        opt.selected && "ring-2 ring-white ring-offset-2 ring-offset-transparent"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Thinking indicator */}
        {isProcessing && (
          <div className="flex justify-end">
            <div className="bg-white rounded-[20px] px-6 py-4 shadow-sm flex gap-1.5 items-center">
              <span className="w-2 h-2 rounded-full bg-[#999] animate-[pulse_1.4s_ease-in-out_infinite]" />
              <span className="w-2 h-2 rounded-full bg-[#999] animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
              <span className="w-2 h-2 rounded-full bg-[#999] animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
            </div>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="relative z-10 mx-8 mb-2">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[14px] text-red-700 text-center">
            {error === "not-allowed"
              ? "Microphone access denied. Please allow mic access in browser settings."
              : `Speech recognition error: ${error}`}
          </div>
        </div>
      )}

      {/* Waveform at bottom */}
      <div className="relative z-10 pb-8 pt-2">
        <VoiceWaveform isActive={isListening} analyserNode={analyserNode} />
      </div>
    </div>
  );
}
