import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Modifier keywords detectable from customer speech, used as a safety net when
// gpt-4o-mini fails to include mentioned modifiers in the add_item action.
const TRANSCRIPT_MODIFIER_PATTERNS: Array<{ pattern: RegExp; group: string; value: string }> = [
  { pattern: /\biced\b/i, group: "temperature", value: "Iced" },
  { pattern: /\bhot\b/i, group: "temperature", value: "Hot" },
  { pattern: /\bcold\b/i, group: "temperature", value: "Cold" },
  { pattern: /\boat(?:\s+milk)?\b/i, group: "milk", value: "Oat" },
  { pattern: /\bwhole(?:\s+milk)?\b/i, group: "milk", value: "Whole" },
  { pattern: /\bskim(?:\s+milk)?\b/i, group: "milk", value: "Skim" },
  { pattern: /\bhemp(?:\s+milk)?\b/i, group: "milk", value: "Hemp" },
  { pattern: /\bsoy(?:\s+milk)?\b/i, group: "milk", value: "Soy" },
  { pattern: /\bcoconut(?:\s+milk)?\b/i, group: "milk", value: "Coconut" },
  { pattern: /\bsmall\b/i, group: "variations", value: "8oz" },
  { pattern: /\blarge\b/i, group: "variations", value: "12oz" },
  { pattern: /\b8\s*oz\b/i, group: "variations", value: "8oz" },
  { pattern: /\b12\s*oz\b/i, group: "variations", value: "12oz" },
  { pattern: /\bvanilla\b/i, group: "add-ons", value: "Vanilla syrup" },
  { pattern: /\bextra shot\b/i, group: "add-ons", value: "Extra shot" },
  { pattern: /\bdrizzle\b/i, group: "add-ons", value: "Drizzle" },
  { pattern: /\bhoney\b/i, group: "add-ons", value: "Honey" },
];

const BEVERAGE_IDS = new Set([
  "cappuccino", "matcha", "iced-coffee", "latte", "espresso",
  "earl-grey", "green", "turmeric", "ginger", "chamomile",
  "iced-earl-grey", "iced-green", "iced-matcha", "arnold-palmer", "peach-tea",
]);

const REQUIRED_BEVERAGE_GROUPS = ["variations", "milk", "temperature"] as const;

function coveredGroups(modifiers: string[]): Set<string> {
  const groups = new Set<string>();
  for (const mod of modifiers) {
    for (const tm of TRANSCRIPT_MODIFIER_PATTERNS) {
      if (tm.value === mod) { groups.add(tm.group); break; }
    }
  }
  return groups;
}

const MENU_CONTEXT = `
You are a POS voice-order assistant for a café. Parse customer speech into structured order actions against this menu.

## Menu Items

BEVERAGES (all support size, milk, temperature, and add-on modifiers):
- cappuccino ($6.00) – Equal parts espresso, steamed milk, thick foam
- matcha ($6.50) – Ceremonial-grade matcha with milk
- iced-coffee ($5.00) – Cold-brewed overnight, served over ice
- latte ($6.00) – Double espresso with steamed milk
- espresso ($4.00) – Concentrated shot of house blend

TEAS:
- earl-grey ($4.00), green ($4.00), turmeric ($4.50), ginger ($4.00)
- chamomile ($4.00) — SOLD OUT

ICED TEAS:
- iced-earl-grey ($4.50), iced-green ($4.50), iced-matcha ($7.00), arnold-palmer ($5.00), peach-tea ($5.00)

BAKERY (supports add-ons only):
- croissant ($4.50), cookie ($3.50), granola ($5.00), baguette ($4.00), sourdough ($6.00)

BEANS (no modifiers):
- house-blend ($18.00), ethiopia-single ($22.00), colombia-single ($21.00), decaf-blend ($19.00)

## Modifier Groups

BEVERAGE MODIFIERS (for any beverage — coffees, matcha, teas):
- variations (REQUIRED, pick 1): "8oz" (base), "12oz" (+$2)
- milk (REQUIRED, pick 1): "Oat", "Whole", "Skim", "Hemp", "Soy", "Coconut"
- temperature (REQUIRED, pick 1): "Hot", "Iced", "Cold"
- add-ons (optional, pick any): "Vanilla syrup" (+$1), "Extra shot" (+$1), "Drizzle" (+$1), "Honey" (free)

BAKERY MODIFIERS:
- add-ons (optional): "Warmed", "Butter" (+$0.50), "Jam" (+$0.50)

## Rules

1. When a customer orders, identify the menu item and any modifiers they mention.
2. CRITICAL — Include ALL mentioned modifiers in the add_item action's "modifiers" array. "Iced latte" → add_item with modifiers ["Iced"]. "Soy iced matcha" → add_item with modifiers ["Soy", "Iced"]. "Large oat milk latte" → add_item with modifiers ["12oz", "Oat"]. Only map exact matches to known options. If they say something not in the options, note it in your message but don't add an invalid modifier.
3. For beverages, the required modifiers are: variations, milk, and temperature. If any required modifier is NOT specified by the customer, ask a follow-up question about it. Only ask about ONE missing group at a time. Do NOT ask about groups the customer already specified (e.g. if they said "iced latte", do NOT ask about temperature).
4. CRITICAL — Every time your assistantMessage asks the customer to choose or pick something, you MUST also set followUp to a non-null object with the full options array. The UI renders these options as tappable pills; without them the customer cannot select. The followUp object must have:
   - "question": your short question (same as assistantMessage)
   - "options": the FULL list of option ids for the modifier group being asked about
   - "targetItemId": the cart item id from the cart snapshot (e.g. "latte-1741628962000")
   - "modifierGroupId": the group id (e.g. "milk", "variations", "temperature")
   The exact options arrays are:
     variations → ["8oz", "12oz"]
     milk → ["Oat", "Whole", "Skim", "Hemp", "Soy", "Coconut"]
     temperature → ["Hot", "Iced", "Cold"]
   NEVER ask a question without a followUp object. NEVER return followUp with an empty options array.
5. CRITICAL — When the customer answers a follow-up (selects a modifier), you MUST return a "set_modifier" action. Do NOT use "add_item" again for the same item. The set_modifier action must have:
   - "type": "set_modifier"
   - "itemId": the CART ITEM ID from the cart snapshot (e.g. "latte-1741628962000"), NOT the menu item id
   - "itemName": the item name
   - "modifiers": the COMPLETE list of all modifier ids the item should have (existing modifiers from the cart snapshot PLUS the newly selected one)
   Example: cart has Latte (id: "latte-1741628962000") with modifiers ["8oz"]. Customer says "Soy". You return:
   {"type": "set_modifier", "itemId": "latte-1741628962000", "itemName": "Latte", "modifiers": ["8oz", "Soy"]}
   Then if there are still missing required groups, also set followUp for the next one.
6. Be conversational and brief. Don't list options in the assistantMessage text — just ask the question (e.g. "What milk would you like?"). The pills handle displaying the choices.
7. "Iced coffee" and "iced tea" variants — if they say "iced", set temperature to "Iced".
8. If you recognize add-ons like "extra shot", "vanilla", "caramel", "honey" — map to the add-ons group.
9. MULTI-ITEM ORDERS: When the customer orders multiple items at once (e.g. "a latte and a matcha"), return multiple add_item actions in one response. Then ask about missing modifiers for the FIRST item that needs them. After all required modifiers are set for the first item, move on to the next item that still has missing required modifiers. Always use followUp.targetItemId set to the specific cart item id you're asking about (from the cart snapshot). Mention which item you're asking about in your assistantMessage (e.g. "For the latte, what milk?").
10. When all items in the order are complete (all required modifiers selected), always ask "Anything else?" and wait. Do NOT say "Let me finalize that" or confirm the order is done. The conversation stays open for the customer to add more items.
`;

const RESPONSE_FORMAT_INSTRUCTIONS = `
Respond with valid JSON only. No markdown, no explanation outside JSON.

{
  "actions": [
    {
      "type": "add_item" | "set_modifier" | "remove_item",
      "itemId": "menu-item-id",
      "itemName": "Human readable name",
      "modifiers": ["modifier-option-id", ...]
    }
  ],
  "followUp": {
    "question": "What size would you like?",
    "options": ["8oz", "12oz"],
    "targetItemId": "the-cart-item-id-or-menu-item-id",
    "modifierGroupId": "variations"
  } | null,
  "entities": [
    { "text": "latte", "type": "item", "resolvedId": "latte" },
    { "text": "oat milk", "type": "modifier", "resolvedId": "Oat" }
  ],
  "assistantMessage": "Brief response to the customer"
}

- For a follow-up answer (e.g. customer picks milk), return one action: type "set_modifier", itemId = the cart item id from the snapshot, modifiers = full array of modifier ids for that item (existing + new).
- "actions" can be empty if no new items/modifiers are being added.
- If you need to ask the customer to choose something (e.g. milk, size, temperature), followUp must NOT be null and followUp.options must be the full array of choice ids for that group (see modifier groups above). Never return followUp with an empty or missing options array when asking a question.
- "followUp" should be null only when no clarification is needed.
- "entities" lists recognized words/phrases from the customer's speech.
- "assistantMessage" is what the POS should display as the system response.
`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey });

  try {
    const body = await req.json();
    const { transcript, conversationHistory, cartSnapshot } = body as {
      transcript: string;
      conversationHistory: Array<{ role: string; content: string }>;
      cartSnapshot?: Array<{
        id: string;
        name: string;
        modifiers?: string[];
      }>;
    };

    if (!transcript && (!conversationHistory || conversationHistory.length === 0)) {
      return NextResponse.json(
        { error: "No transcript or conversation history provided" },
        { status: 400 }
      );
    }

    const cartContext = cartSnapshot?.length
      ? `\n\nCurrent cart:\n${cartSnapshot.map((i) => `- ${i.name} (id: ${i.id})${i.modifiers?.length ? ` [${i.modifiers.join(", ")}]` : ""}`).join("\n")}`
      : "\n\nCart is empty.";

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: MENU_CONTEXT + cartContext + "\n\n" + RESPONSE_FORMAT_INSTRUCTIONS,
      },
    ];

    if (conversationHistory?.length) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    if (transcript) {
      messages.push({ role: "user", content: transcript });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed;
    try {
      const jsonStr = raw.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = {
        actions: [],
        followUp: null,
        entities: [],
        assistantMessage: raw,
      };
    }

    // Server-side fix: ensure followUp always has the correct options array.
    const MODIFIER_OPTIONS: Record<string, string[]> = {
      variations: ["8oz", "12oz"],
      milk: ["Oat", "Whole", "Skim", "Hemp", "Soy", "Coconut"],
      temperature: ["Hot", "Iced", "Cold"],
      "add-ons": ["Vanilla syrup", "Extra shot", "Drizzle", "Honey"],
    };

    const BEVERAGE_REQUIRED_COUNT = 3;

    // ---- Extract modifiers mentioned in the transcript but missed by the LLM ----
    // Split the transcript into per-item segments at conjunctions so modifiers
    // are only associated with their adjacent item (e.g. "iced latte and matcha"
    // assigns Iced only to the latte, not the matcha).
    if (transcript && parsed.actions?.length) {
      const t = transcript.toLowerCase();
      const segments = t.split(/\s+(?:and|also|plus)\s+|,\s*/);

      for (const action of parsed.actions as Array<{ type: string; itemId: string; itemName?: string; modifiers?: string[] }>) {
        if (action.type !== "add_item" || !BEVERAGE_IDS.has(action.itemId)) continue;

        const groups = coveredGroups(action.modifiers ?? []);
        const itemName = (action.itemName ?? action.itemId.replace(/-/g, " ")).toLowerCase();
        const segment = segments.find((s) => s.includes(itemName));
        if (!segment) continue;

        for (const { pattern, group, value } of TRANSCRIPT_MODIFIER_PATTERNS) {
          if (groups.has(group)) continue;
          if (pattern.test(segment)) {
            if (!action.modifiers) action.modifiers = [];
            action.modifiers.push(value);
            groups.add(group);
          }
        }
      }

      // If the followUp asks about a modifier group that's now already covered
      // by an injected modifier, advance to the next missing required group.
      if (parsed.followUp?.modifierGroupId) {
        const targetAction = (parsed.actions as Array<{ type: string; itemId: string; itemName?: string; modifiers?: string[] }>)
          .find((a) => a.type === "add_item" && BEVERAGE_IDS.has(a.itemId));
        if (targetAction) {
          const groups = coveredGroups(targetAction.modifiers ?? []);
          if (groups.has(parsed.followUp.modifierGroupId)) {
            const nextGroup = REQUIRED_BEVERAGE_GROUPS.find((g) => !groups.has(g));
            if (nextGroup && MODIFIER_OPTIONS[nextGroup]) {
              const groupLabel = nextGroup === "variations" ? "size" : nextGroup;
              const name = targetAction.itemName ?? targetAction.itemId;
              parsed.assistantMessage = `What ${groupLabel} would you like for your ${name.toLowerCase()}?`;
              parsed.followUp = {
                ...parsed.followUp,
                question: parsed.assistantMessage,
                options: MODIFIER_OPTIONS[nextGroup],
                modifierGroupId: nextGroup,
              };
            } else {
              parsed.followUp = null;
            }
          }
        }
      }
    }

    /** Determine the correct cart item a followUp question is targeting. */
    const resolveFollowUpTarget = (
      message: string,
      snapshot: NonNullable<typeof cartSnapshot>,
      hintId?: string,
    ): string | undefined => {
      const msg = message.toLowerCase();
      // Match by item name mentioned in the message (e.g. "for your latte")
      const matches = snapshot.filter((c) => msg.includes(c.name.toLowerCase()));
      if (matches.length === 1) return matches[0].id;
      if (matches.length > 1) {
        const incomplete = matches.find(
          (c) => !c.modifiers || c.modifiers.length < BEVERAGE_REQUIRED_COUNT
        );
        return (incomplete ?? matches[matches.length - 1]).id;
      }
      // If hintId is a valid cart item, use it
      if (hintId) {
        const found = snapshot.find(
          (c) => c.id === hintId || c.id.startsWith(`${hintId}-`)
        );
        if (found) return found.id;
      }
      // Fallback: first item still missing required modifiers
      const incomplete = snapshot.find(
        (c) => !c.modifiers || c.modifiers.length < BEVERAGE_REQUIRED_COUNT
      );
      return incomplete?.id ?? snapshot[snapshot.length - 1]?.id;
    };

    if (parsed.followUp?.modifierGroupId && MODIFIER_OPTIONS[parsed.followUp.modifierGroupId]) {
      if (!parsed.followUp.options || parsed.followUp.options.length === 0) {
        parsed.followUp.options = MODIFIER_OPTIONS[parsed.followUp.modifierGroupId];
      }
    }

    // If the LLM asks a question in assistantMessage but forgot followUp, detect and inject it.
    // Only trigger when the message is actually a question (contains "?").
    if (!parsed.followUp && parsed.assistantMessage && parsed.assistantMessage.includes("?")) {
      const msg = parsed.assistantMessage.toLowerCase();
      let detectedGroup: string | null = null;
      if (msg.includes("what milk") || msg.includes("which milk") || msg.includes("what type of milk") || msg.includes("what kind of milk")) detectedGroup = "milk";
      else if (msg.includes("what size") || msg.includes("which size") || msg.includes("what variation")) detectedGroup = "variations";
      else if (msg.includes("what temperature") || msg.includes("hot or iced") || msg.includes("hot, iced")) detectedGroup = "temperature";

      if (detectedGroup && cartSnapshot?.length && MODIFIER_OPTIONS[detectedGroup]) {
        const targetId = resolveFollowUpTarget(parsed.assistantMessage, cartSnapshot);
        if (targetId) {
          parsed.followUp = {
            question: parsed.assistantMessage,
            options: MODIFIER_OPTIONS[detectedGroup],
            targetItemId: targetId,
            modifierGroupId: detectedGroup,
          };
        }
      }
    }

    // Verify/correct the followUp targetItemId even when the LLM provides one,
    // since the LLM often sends the wrong cart item id in multi-item orders.
    if (parsed.followUp && cartSnapshot?.length) {
      const correctedId = resolveFollowUpTarget(
        parsed.followUp.question || parsed.assistantMessage,
        cartSnapshot,
        parsed.followUp.targetItemId,
      );
      if (correctedId) {
        parsed.followUp.targetItemId = correctedId;
      }
    }

    // Post-process actions: fix mismatched action types / item IDs from the LLM.
    if (parsed.actions?.length && cartSnapshot?.length) {
      parsed.actions = parsed.actions.map(
        (a: { type: string; itemId: string; itemName?: string; modifiers?: string[] }) => {
          if (a.type === "add_item" && a.modifiers?.length) {
            // LLM sent add_item with modifiers for an item already in the cart →
            // convert to set_modifier so the existing item is updated in-place.
            const actionSet = new Set(a.modifiers);
            const existing = cartSnapshot.find((c) => {
              if (!c.id.startsWith(`${a.itemId}-`)) return false;
              const mods = c.modifiers ?? [];
              if (mods.length === 0) return true;
              return mods.length <= a.modifiers!.length && mods.every((m) => actionSet.has(m));
            });
            if (existing) {
              return { ...a, type: "set_modifier", itemId: existing.id };
            }
          }
          if (a.type === "set_modifier") {
            // LLM may have sent the menu-item id instead of the cart-item id.
            const exactMatch = cartSnapshot.find((c) => c.id === a.itemId);
            if (!exactMatch) {
              const prefixMatch = cartSnapshot.find((c) => c.id.startsWith(`${a.itemId}-`));
              if (prefixMatch) {
                return { ...a, itemId: prefixMatch.id };
              }
            }
          }
          return a;
        }
      );
    }

    // ---- Final safety net: don't end the conversation while items are incomplete ----
    // Build the effective modifier state after this response's actions are applied,
    // then check if any beverage still needs required modifiers.
    if (!parsed.followUp) {
      const effectiveMods = new Map<string, { name: string; mods: string[] }>();

      // Seed from cart snapshot
      if (cartSnapshot?.length) {
        for (const c of cartSnapshot) {
          effectiveMods.set(c.id, { name: c.name, mods: [...(c.modifiers ?? [])] });
        }
      }

      // Apply actions from this response
      for (const action of (parsed.actions ?? []) as Array<{ type: string; itemId: string; itemName?: string; modifiers?: string[] }>) {
        if (action.type === "add_item") {
          effectiveMods.set(`__new_${action.itemId}`, {
            name: action.itemName ?? action.itemId,
            mods: [...(action.modifiers ?? [])],
          });
        } else if (action.type === "set_modifier" && action.modifiers) {
          const entry = effectiveMods.get(action.itemId);
          if (entry) {
            entry.mods = Array.from(new Set([...entry.mods, ...action.modifiers]));
          }
        }
      }

      // Find the first beverage item still missing a required modifier group
      for (const [id, { name, mods }] of effectiveMods) {
        const isBeverage = [...BEVERAGE_IDS].some(
          (bev) => id === bev || id.startsWith(`${bev}-`) || id === `__new_${bev}`
        );
        if (!isBeverage) continue;

        const groups = coveredGroups(mods);
        const missingGroup = REQUIRED_BEVERAGE_GROUPS.find((g) => !groups.has(g));
        if (missingGroup && MODIFIER_OPTIONS[missingGroup]) {
          const groupLabel = missingGroup === "variations" ? "size" : missingGroup;
          parsed.assistantMessage = `What ${groupLabel} would you like for your ${name.toLowerCase()}?`;
          parsed.followUp = {
            question: parsed.assistantMessage,
            options: MODIFIER_OPTIONS[missingGroup],
            targetItemId: id.startsWith("__new_") ? id.slice(6) : id,
            modifierGroupId: missingGroup,
          };
          break;
        }
      }
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Voice order API error:", err);
    return NextResponse.json(
      { error: "Failed to process voice order" },
      { status: 500 }
    );
  }
}
