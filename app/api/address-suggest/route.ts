import { NextResponse } from "next/server";
import type { AddressSuggestionItem } from "@/lib/address-suggest-types";
import { parseNominatimUsAddress } from "@/lib/nominatim-us-address";

type NominatimHit = {
  place_id: number;
  display_name: string;
  address?: Record<string, string | undefined>;
};

const MAX_QUERY_LEN = 180;
/** Nominatim usage policy: identify the application with a valid User-Agent. */
const USER_AGENT =
  "PortfolioRetailPOS/1.0 (retail shipment address autocomplete; nominatim)";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const empty = (): AddressSuggestionItem[] => [];

  if (q.length < 3) {
    return NextResponse.json({ suggestions: empty() });
  }
  if (q.length > MAX_QUERY_LEN) {
    return NextResponse.json({ suggestions: empty() });
  }

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("q", q);
  nominatimUrl.searchParams.set("countrycodes", "us");
  nominatimUrl.searchParams.set("format", "jsonv2");
  nominatimUrl.searchParams.set("addressdetails", "1");
  nominatimUrl.searchParams.set("limit", "8");

  let upstream: Response;
  try {
    upstream = await fetch(nominatimUrl.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ suggestions: empty() }, { status: 503 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ suggestions: empty() }, { status: 502 });
  }

  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    return NextResponse.json({ suggestions: empty() });
  }

  if (!Array.isArray(data)) {
    return NextResponse.json({ suggestions: empty() });
  }

  const suggestions: AddressSuggestionItem[] = (data as NominatimHit[])
    .filter((row) => row.place_id != null && row.display_name)
    .map((row) => {
      const parsed = parseNominatimUsAddress(row.address, row.display_name);
      return {
        id: String(row.place_id),
        label: row.display_name,
        ...parsed,
      };
    });

  return NextResponse.json({ suggestions });
}
