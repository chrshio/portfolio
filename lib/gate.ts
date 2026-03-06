export const GATE_STORAGE_KEY = "gate_passed";

export function isGatePassed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(GATE_STORAGE_KEY) === "true";
}
