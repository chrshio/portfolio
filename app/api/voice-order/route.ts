import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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
2. If the customer specifies a modifier that maps to a known option, include it. Only map exact matches. If they say something not in the options, note it in your message but don't add an invalid modifier.
3. For beverages, the required modifiers are: variations, milk, and temperature. If any required modifier is NOT specified by the customer, ask a follow-up question about it. Only ask about ONE missing group at a time.
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

    if (parsed.followUp?.modifierGroupId && MODIFIER_OPTIONS[parsed.followUp.modifierGroupId]) {
      if (!parsed.followUp.options || parsed.followUp.options.length === 0) {
        parsed.followUp.options = MODIFIER_OPTIONS[parsed.followUp.modifierGroupId];
      }
    }

    // If the LLM asks a question in assistantMessage but forgot followUp, detect and inject it.
    // Only trigger when the message is actually a question (contains "?").
    if (!parsed.followUp && parsed.assistantMessage && parsed.assistantMessage.includes("?")) {
      const msg = parsed.assistantMessage.toLowerCase();
      const lastCartItem = cartSnapshot?.[cartSnapshot.length - 1];
      let detectedGroup: string | null = null;
      if (msg.includes("what milk") || msg.includes("which milk") || msg.includes("what type of milk") || msg.includes("what kind of milk")) detectedGroup = "milk";
      else if (msg.includes("what size") || msg.includes("which size") || msg.includes("what variation")) detectedGroup = "variations";
      else if (msg.includes("what temperature") || msg.includes("hot or iced") || msg.includes("hot, iced")) detectedGroup = "temperature";

      if (detectedGroup && lastCartItem && MODIFIER_OPTIONS[detectedGroup]) {
        parsed.followUp = {
          question: parsed.assistantMessage,
          options: MODIFIER_OPTIONS[detectedGroup],
          targetItemId: lastCartItem.id,
          modifierGroupId: detectedGroup,
        };
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
