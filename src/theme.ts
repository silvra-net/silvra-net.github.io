/** Theme choice. `null` means "follow the OS", which is the default and stores nothing. */
export type Theme = "light" | "dark" | null;

const KEY = "silvra-theme";
const DARK_BAR = "#0a0c09";
const LIGHT_BAR = "#f7f7f3";

export function getTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null; // private mode: the OS preference is the only signal we get
  }
}

export function setTheme(t: Theme): void {
  try {
    if (t === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {
    /* not being able to remember the choice must not stop us applying it */
  }
  const root = document.documentElement;
  if (t === null) root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", t);
  // The browser's own bar: the chosen colour on both theme-color metas, or each back to the
  // scheme its media query names when the OS decides again. Mirrors index.html.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((el) => {
    const dark = t ? t === "dark" : el.media.includes("dark");
    el.content = dark ? DARK_BAR : LIGHT_BAR;
  });
}
