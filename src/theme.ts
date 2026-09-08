/** Theme choice. `null` means "follow the OS", which is the default and stores nothing. */
export type Theme = "light" | "dark" | null;

const KEY = "silvra-theme";

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
}

/** What the page is actually showing right now, OS preference included. */
export function resolvedTheme(): "light" | "dark" {
  const explicit = getTheme();
  if (explicit) return explicit;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}
