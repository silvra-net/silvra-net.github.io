import { useEffect, useState } from "react";

export type Os = "mac" | "windows" | "linux" | "mobile" | "unknown";

/** The visitor's operating system, as far as the browser says — for naming the right download. */
export function detectOs(): Os {
  if (typeof navigator === "undefined") return "unknown";
  const nav = navigator as Navigator & { userAgentData?: { platform?: string; mobile?: boolean } };
  if (nav.userAgentData?.mobile) return "mobile";
  const p = `${nav.userAgentData?.platform ?? ""} ${nav.platform ?? ""} ${nav.userAgent}`.toLowerCase();
  if (/android|iphone|ipad|ipod|mobile/.test(p)) return "mobile";
  if (/mac/.test(p)) return "mac";
  if (/win/.test(p)) return "windows";
  if (/linux|x11|cros/.test(p)) return "linux";
  return "unknown";
}

/** Detected after mount, so a prerendered page and the live one start from the same markup. */
export function useOs(): Os {
  const [os, setOs] = useState<Os>("unknown");
  useEffect(() => setOs(detectOs()), []);
  return os;
}
