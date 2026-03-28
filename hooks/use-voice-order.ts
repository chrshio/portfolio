"use client";

import { useState, useCallback, useRef } from "react";
import type { VoiceMessage, VoiceEntity } from "@/components/pos-voice/voice-overlay";

// ---- Types for the LLM response ----

export interface VoiceOrderAction {
  type: "add_item" | "set_modifier" | "remove_item";
  itemId: string;
  itemName: string;
  modifiers?: string[];
}

export interface VoiceOrderFollowUp {
  question: string;
  options: string[];
  targetItemId: string;
  modifierGroupId: string;
}

export interface VoiceOrderResponse {
  actions: VoiceOrderAction[];
  followUp: VoiceOrderFollowUp | null;
  entities: Array<{ text: string; type: "item" | "modifier"; resolvedId: string }>;
  assistantMessage: string;
}

// ---- Callbacks the parent provides ----

export interface VoiceOrderCallbacks {
  onAddItem: (itemId: string, modifiers?: string[]) => void;
  /** Update modifiers on an existing cart item (e.g. when customer answers a follow-up). */
  onSetModifier?: (cartItemId: string, modifiers: string[]) => void;
  getCartSnapshot: () => Array<{ id: string; name: string; modifiers?: string[] }>;
}

// ---- Hook ----

export interface UseVoiceOrderReturn {
  messages: VoiceMessage[];
  isProcessing: boolean;
  processTranscript: (transcript: string) => Promise<void>;
  handleSuggestionSelect: (messageId: string, optionLabel: string) => void;
  reset: () => void;
}

export function useVoiceOrder(callbacks: VoiceOrderCallbacks): UseVoiceOrderReturn {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const msgCounter = useRef(0);
  const conversationHistory = useRef<Array<{ role: string; content: string }>>([]);
  const pendingFollowUp = useRef<VoiceOrderFollowUp | null>(null);

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const nextId = () => {
    msgCounter.current += 1;
    return `voice-${msgCounter.current}`;
  };

  const callApi = useCallback(
    async (transcript: string): Promise<VoiceOrderResponse | null> => {
      try {
        const res = await fetch("/api/voice-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            conversationHistory: conversationHistory.current,
            cartSnapshot: callbacksRef.current.getCartSnapshot(),
          }),
        });
        if (!res.ok) return null;
        return (await res.json()) as VoiceOrderResponse;
      } catch {
        return null;
      }
    },
    []
  );

  const resolveCartItem = (
    snapshot: Array<{ id: string; name: string; modifiers?: string[] }>,
    actionItemId: string,
    actionModifiers: string[],
  ) => {
    const exact = snapshot.find((item) => item.id === actionItemId);
    if (exact) return exact;
    // Fallback: the LLM may have sent the menu-item id (e.g. "latte")
    // instead of the cart-item id (e.g. "latte-1741628962000-1").
    const actionSet = new Set(actionModifiers);
    return (
      snapshot.find((item) => {
        if (!item.id.startsWith(`${actionItemId}-`)) return false;
        const existing = item.modifiers ?? [];
        return existing.length < actionModifiers.length ||
          (existing.length > 0 && existing.every((m) => actionSet.has(m)));
      }) ??
      snapshot.find((item) => item.id.startsWith(`${actionItemId}-`))
    );
  };

  const mergeModifiers = (existing: string[], incoming: string[]) =>
    Array.from(new Set([...existing, ...incoming]));

  const applyActions = useCallback((actions: VoiceOrderAction[]) => {
    for (const action of actions) {
      if (action.type === "add_item") {
        // Guard: if the LLM sends add_item with modifiers for a menu item that
        // already exists in the cart with incomplete modifiers (or modifiers that
        // are a subset of the incoming ones), treat it as a set_modifier update
        // so the original item gets configured in-place instead of being duplicated.
        if (action.modifiers?.length && callbacksRef.current.onSetModifier) {
          const snapshot = callbacksRef.current.getCartSnapshot();
          const actionSet = new Set(action.modifiers);
          const existingIncomplete = snapshot.find((item) => {
            if (!item.id.startsWith(`${action.itemId}-`)) return false;
            const existing = item.modifiers ?? [];
            if (existing.length === 0) return true;
            return existing.length <= action.modifiers!.length &&
              existing.every((m) => actionSet.has(m));
          });
          if (existingIncomplete) {
            const merged = mergeModifiers(existingIncomplete.modifiers ?? [], action.modifiers);
            callbacksRef.current.onSetModifier(existingIncomplete.id, merged);
            continue;
          }
        }
        callbacksRef.current.onAddItem(action.itemId, action.modifiers);
      } else if (action.type === "set_modifier" && callbacksRef.current.onSetModifier && action.modifiers) {
        const snapshot = callbacksRef.current.getCartSnapshot();
        const target = resolveCartItem(snapshot, action.itemId, action.modifiers);
        if (target) {
          // Merge rather than replace so optimistic updates from pill taps
          // are never clobbered by a stale API response with fewer modifiers.
          const merged = mergeModifiers(target.modifiers ?? [], action.modifiers);
          callbacksRef.current.onSetModifier(target.id, merged);
        }
      }
    }
  }, []);

  const processTranscript = useCallback(
    async (transcript: string) => {
      if (!transcript.trim()) return;

      const customerMsg: VoiceMessage = {
        id: nextId(),
        role: "customer",
        text: transcript,
      };

      setMessages((prev) => {
        const clean = prev.filter((m) => !m.isInterim);
        return [...clean, customerMsg];
      });

      conversationHistory.current.push({ role: "user", content: transcript });
      setIsProcessing(true);

      // Small delay so React flushes pending state (e.g. cart items from prior applyActions)
      // before we snapshot the cart for the API call.
      await new Promise((r) => setTimeout(r, 50));

      const response = await callApi(transcript);
      setIsProcessing(false);

      if (!response) {
        const errMsg: VoiceMessage = {
          id: nextId(),
          role: "assistant",
          text: "Sorry, I didn\u2019t catch that. Could you repeat?",
        };
        setMessages((prev) => [...prev, errMsg]);
        return;
      }

      applyActions(response.actions);

      const entities: VoiceEntity[] = response.entities.map((e) => ({
        text: e.text,
        type: e.type,
      }));
      if (entities.length > 0) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === customerMsg.id ? { ...m, entities } : m
          )
        );
      }

      pendingFollowUp.current = response.followUp;

      const assistantMsg: VoiceMessage = {
        id: nextId(),
        role: "assistant",
        text: response.assistantMessage,
        suggestion: response.followUp
          ? {
              options: response.followUp.options.map((label) => ({
                label,
              })),
            }
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      conversationHistory.current.push({
        role: "assistant",
        content: response.assistantMessage,
      });
    },
    [callApi, applyActions]
  );

  const handleSuggestionSelect = useCallback(
    (messageId: string, optionLabel: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId || !m.suggestion) return m;
          return {
            ...m,
            suggestion: {
              ...m.suggestion,
              options: m.suggestion.options.map((o) => ({
                ...o,
                selected: o.label === optionLabel,
              })),
            },
          };
        })
      );

      // Optimistically apply the modifier so the cart updates immediately
      // instead of waiting for the API round-trip. This also guards against
      // the LLM failing to emit a set_modifier action for the target item.
      if (pendingFollowUp.current && callbacksRef.current.onSetModifier) {
        const { targetItemId } = pendingFollowUp.current;
        const snapshot = callbacksRef.current.getCartSnapshot();
        const targetItem =
          snapshot.find((item) => item.id === targetItemId) ??
          snapshot.find((item) => item.id.startsWith(`${targetItemId}-`));
        if (targetItem) {
          const existing = targetItem.modifiers ?? [];
          callbacksRef.current.onSetModifier(targetItem.id, [...existing, optionLabel]);
        }
      }

      processTranscript(optionLabel);
    },
    [processTranscript]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setIsProcessing(false);
    conversationHistory.current = [];
    pendingFollowUp.current = null;
    msgCounter.current = 0;
  }, []);

  return { messages, isProcessing, processTranscript, handleSuggestionSelect, reset };
}
