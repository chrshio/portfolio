/** Map Nominatim `address` + display name into retail shipment form fields (US-focused). */

export type ParsedUsAddressFields = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

type NominatimAddress = Record<string, string | undefined>;

export function parseNominatimUsAddress(
  address: NominatimAddress | undefined,
  displayName: string,
): ParsedUsAddressFields {
  const a = address ?? {};

  const house = (a.house_number ?? "").trim();
  const road = (a.road ?? "").trim();
  const lineFromParts = [house, road].filter(Boolean).join(" ").trim();

  let addressLine1 = lineFromParts;
  if (!addressLine1) {
    addressLine1 =
      [a.house_name, a.amenity, a.building].find((v) => v?.trim())?.trim() ??
      "";
  }
  if (!addressLine1) {
    addressLine1 =
      (a.pedestrian ?? "").trim() || (a.path ?? "").trim() || "";
  }
  if (!addressLine1 && displayName) {
    addressLine1 = displayName.split(",")[0]?.trim() ?? "";
  }

  let addressLine2 = "";
  const unit = (a.unit ?? "").trim();
  if (unit) addressLine2 = unit.startsWith("#") ? unit : `Unit ${unit}`;

  const city =
    (
      a.city ||
      a.town ||
      a.village ||
      a.hamlet ||
      a.municipality ||
      a.suburb ||
      ""
    ).trim() || "";

  const region = (a.state ?? a.state_district ?? "").trim() || "";

  let postalCode = (a.postcode ?? "").trim();
  if (postalCode.includes(";")) {
    postalCode = postalCode.split(";")[0]!.trim();
  }

  const countryCode = (a.country_code ?? "").toLowerCase();
  const country =
    countryCode === "us"
      ? "United States"
      : (a.country ?? "").trim() || "United States";

  return {
    addressLine1,
    addressLine2,
    city,
    region,
    postalCode,
    country,
  };
}
